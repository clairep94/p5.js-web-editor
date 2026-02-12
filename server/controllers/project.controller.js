import JSZip from 'jszip';
import format from 'date-fns/format';
import isUrl from 'is-url';
import { JSDOM } from 'jsdom';
import mime from 'mime';
import isAfter from 'date-fns/isAfter';
import axios from 'axios';
import slugify from 'slugify';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Project from '../models/project';
import { User } from '../models/user';
import { resolvePathToFile } from '../utils/filePath';
import { generateFileSystemSafeName } from '../utils/generateFileSystemSafeName';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
});

export {
  default as createProject,
  apiCreateProject
} from './project.controller/createProject';
export { default as deleteProject } from './project.controller/deleteProject';
export {
  default as getProjectsForUser,
  apiGetProjectsForUser
} from './project.controller/getProjectsForUser';

export async function updateProject(req, res) {
  try {
    const project = await Project.findById(req.params.project_id).exec();
    if (!project) {
      res.status(404).send({
        success: false,
        message: 'Project with that id does not exist.'
      });
      return;
    }
    if (!project.user.equals(req.user._id)) {
      res.status(403).send({
        success: false,
        message: 'Session does not match owner of project.'
      });
      return;
    }
    if (
      req.body.updatedAt &&
      isAfter(new Date(project.updatedAt), new Date(req.body.updatedAt))
    ) {
      res.status(409).send({
        success: false,
        message: 'Attempted to save stale version of project.'
      });
      return;
    }
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.project_id,
      {
        $set: req.body
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('user', 'username')
      .exec();
    if (
      req.body.files &&
      updatedProject.files.length !== req.body.files.length
    ) {
      const oldFileIds = updatedProject.files.map((file) => file.id);
      const newFileIds = req.body.files.map((file) => file.id);
      const staleIds = oldFileIds.filter((id) => newFileIds.indexOf(id) === -1);
      staleIds.forEach((staleId) => {
        updatedProject.files.id(staleId).deleteOne();
      });
      const savedProject = await updatedProject.save();
      res.json(savedProject);
    } else {
      res.json(updatedProject);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
}

export async function getProject(req, res) {
  const { project_id: projectId, username } = req.params;
  const user = await User.findByUsername(username);
  if (!user) {
    return res
      .status(404)
      .send({ message: 'User with that username does not exist' });
  }
  const project = await Project.findOne({
    user: user._id,
    $or: [{ _id: projectId }, { slug: projectId }]
  }).populate('user', 'username');
  if (!project) {
    return res
      .status(404)
      .send({ message: 'Project with that id does not exist' });
  }
  return res.json(project);
}

export async function getProjectAsset(req, res) {
  const projectId = req.params.project_id;
  const project = await Project.findOne({
    $or: [{ _id: projectId }, { slug: projectId }]
  })
    .populate('user', 'username')
    .exec();
  if (!project) {
    return res
      .status(404)
      .send({ message: 'Project with that id does not exist' });
  }

  const filePath = req.params[0];
  const resolvedFile = resolvePathToFile(filePath, project.files);
  if (!resolvedFile) {
    return res.status(404).send({ message: 'Asset does not exist' });
  }
  const contentType =
    mime.getType(resolvedFile.name) || 'application/octet-stream';
  if (!resolvedFile.url) {
    res.set('Content-Type', contentType);
    return res.send(resolvedFile.content);
  }

  try {
    const { data } = await axios.get(resolvedFile.url, {
      responseType: 'arraybuffer'
    });
    res.set('Content-Type', contentType);
    return res.send(data);
  } catch (error) {
    return res.status(404).send({ message: 'Asset does not exist' });
  }
}

export async function getProjects(req, res) {
  if (req.user) {
    const projects = await Project.getProjectsForUserId(req.user._id);
    res.json(projects);
  } else {
    // could just move this to client side
    res.json([]);
  }
}

/**
 * @param {string} projectId
 * @return {Promise<boolean>}
 */
export async function projectExists(projectId) {
  const project = await Project.findById(projectId);
  return project != null;
}

/**
 * @param {string} username
 * @param {string} projectId - the database id or the slug or the project
 * @return {Promise<boolean>}
 */
export async function projectForUserExists(username, projectId) {
  const user = await User.findByUsername(username);
  if (!user) return false;
  const project = await Project.findOne({
    user: user._id,
    $or: [{ _id: projectId }, { slug: projectId }]
  });
  return project != null;
}

/**
 * @param {string} username
 * @param {string} projectId - the database id or the slug or the project
 * @return {Promise<object>}
 */
export async function getProjectForUser(username, projectId) {
  const user = await User.findByUsername(username);
  if (!user) return { exists: false };
  const project = await Project.findOne({
    user: user._id,
    $or: [{ _id: projectId }, { slug: projectId }]
  });
  return project != null
    ? { exists: true, userProject: project }
    : { exists: false };
}

/**
 * Adds URLs referenced in <script> tags to the `files` array of the project
 * so that they can be downloaded along with other remote files from S3.
 * @param {object} project
 * @void - modifies the `project` parameter
 */
function bundleExternalLibs(project) {
  const indexHtml = project.files.find((file) => file.name === 'index.html');
  if (!indexHtml || !indexHtml.content) {
    return; // Gracefully handle missing index.html
  }

  const { window } = new JSDOM(indexHtml.content);
  const scriptTags = window.document.getElementsByTagName('script');

  Object.values(scriptTags).forEach(({ src }) => {
    if (!isUrl(src)) return;

    const path = src.split('/');
    const filename = path[path.length - 1];

    // Prevent duplicate external libs if downloaded multiple times
    if (project.files.some((f) => f.name === filename && f.url === src)) {
      return;
    }

    project.files.push({
      name: filename,
      url: src
    });

    const libId = project.files.find((file) => file.name === filename).id;
    project.files.find((file) => file.name === 'root').children.push(libId);
  });
}

/**
 * Helper function to get a readable stream from an S3 URL
 * Optimized to return stream handle quickly without waiting for data
 * @param {string} url - S3 URL
 * @return {Promise<Readable>}
 */
async function getStreamFromS3Url(url) {
  // Parse the S3 URL to get bucket and key
  const urlObj = new URL(url);
  let bucket;
  let key;

  // Support different S3 URL formats
  if (urlObj.hostname.includes('s3')) {
    // Format: https://bucket-name.s3.region.amazonaws.com/key
    // or https://s3.region.amazonaws.com/bucket-name/key
    if (urlObj.hostname.startsWith('s3')) {
      // https://s3.region.amazonaws.com/bucket-name/key
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      [bucket] = pathParts;
      key = pathParts.slice(1).join('/');
    } else {
      // https://bucket-name.s3.region.amazonaws.com/key
      [bucket] = urlObj.hostname.split('.');
      key = urlObj.pathname.substring(1);
    }

    // by nityam, Get S3 object stream - returns immediately with stream handle
    // Data is only fetched when the stream is consumed (by JSZip)
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);

    // Ensure we return the stream, not buffer the response
    return response.Body;
  }

  // Not an S3 URL, fall back to axios with streaming
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 30000
  });
  return response.data;
}

/**
 * Recursively adds a file and all of its children to the JSZip instance using streaming.
 * Files are fetched sequentially to avoid memory overload.
 * @param {object} file
 * @param {Array<object>} files
 * @param {JSZip} zip
 * @return {Promise<void>} - modifies the `zip` parameter
 */
async function addFileToZip(file, files, zip) {
  if (file.fileType === 'folder') {
    const folderZip = file.name === 'root' ? zip : zip.folder(file.name);
    // Process children sequentially to avoid fetching all files upfront
    await file.children.reduce(async (previousPromise, fileId) => {
      await previousPromise;
      const childFile = files.find((f) => f.id === fileId);
      return addFileToZip(childFile, files, folderZip);
    }, Promise.resolve());
  } else if (file.url) {
    try {
      // Check if this is an S3 URL
      if (file.url.includes('s3') && file.url.includes('amazonaws.com')) {
        // Use S3 streaming for S3 URLs
        // This gets the stream handle quickly - actual data is fetched by JSZip during generation
        const stream = await getStreamFromS3Url(file.url);
        zip.file(file.name, stream, { binary: true });
      } else {
        // For external URLs, use axios with streaming
        const response = await axios.get(file.url, {
          responseType: 'stream',
          timeout: 30000
        });
        zip.file(file.name, response.data, { binary: true });
      }
    } catch (e) {
      console.warn(`Failed to fetch file from ${file.url}:`, e.message);
      // Add empty file on error to prevent ZIP corruption
      zip.file(file.name, Buffer.alloc(0));
    }
  } else {
    // Regular file with inline content
    zip.file(file.name, file.content);
  }
}

async function buildZip(project, req, res) {
  let keepaliveInterval;

  try {
    const zip = new JSZip();
    const currentTime = format(new Date(), 'yyyy_MM_dd_HH_mm_ss');
    project.slug = slugify(project.name, '_');
    const zipFileName = `${generateFileSystemSafeName(
      project.slug
    )}_${currentTime}.zip`;
    const { files } = project;
    const root = files.find((file) => file.name === 'root');

    if (!root) {
      throw new Error('Project has no root folder');
    }

    bundleExternalLibs(project);

    // Send headers immediately to prevent gateway timeout
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-disposition': `attachment; filename=${zipFileName}`,
      'Transfer-Encoding': 'chunked'
    });

    // Send periodic keepalive comments to prevent gateway timeout
    // while we're building the file list. ZIP format allows for this.
    let keepaliveCounter = 0;
    keepaliveInterval = setInterval(() => {
      // Write a comment to keep connection alive without corrupting ZIP
      // This prevents 60s gateway timeouts during file list building
      if (!res.writableEnded) {
        res.write(Buffer.alloc(0)); // Empty write to keep connection alive
        keepaliveCounter++;
        if (keepaliveCounter % 10 === 0) {
          console.log(
            `Keepalive: Building ZIP file list (${keepaliveCounter}s elapsed)...`
          );
        }
      }
    }, 1000); // Every second

    // Sequentially add files - this avoids parallel S3 connection storms
    // but still requires getting all file references before streaming begins
    await addFileToZip(root, files, zip);

    // Clear keepalive now that we're about to start streaming real data
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;

    // Generate ZIP stream with true end-to-end streaming
    // streamFiles: true means JSZip reads from our S3 streams on-demand
    const zipStream = zip.generateNodeStream({
      type: 'nodebuffer',
      streamFiles: true,
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Pipe the ZIP stream to response - handles backpressure automatically
    zipStream.pipe(res);

    // Handle stream errors
    zipStream.on('error', (err) => {
      console.error('Error streaming zip file:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate zip file. Please try again.'
        });
      } else {
        res.end();
      }
    });

    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      zipStream.on('end', resolve);
      zipStream.on('error', reject);
      res.on('error', reject);
      res.on('close', () => {
        // Client disconnected
        reject(new Error('Client disconnected'));
      });
    });
  } catch (err) {
    console.error('Error building zip file:', err);

    // Clean up keepalive if still running
    if (keepaliveInterval) {
      clearInterval(keepaliveInterval);
    }

    // Only send error if response hasn't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate zip file. Please try again.'
      });
    } else {
      res.end();
    }
  }
}

export async function downloadProjectAsZip(req, res) {
  try {
    const project = await Project.findById(req.params.project_id).exec();
    if (!project) {
      res.status(404).send({ message: 'Project with that id does not exist' });
      return;
    }
    // Await buildZip to ensure it completes before the function returns
    await buildZip(project, req, res);
  } catch (err) {
    console.error('Error in downloadProjectAsZip:', err);
    // Only send error if response hasn't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to download project. Please try again.'
      });
    }
  }
}

export async function changeProjectVisibility(req, res) {
  try {
    const { projectId, visibility: newVisibility } = req.body;

    const project = await Project.findOne({
      $or: [{ _id: projectId }, { slug: projectId }]
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'No project found.' });
    }

    if (!project.user.equals(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action.' });
    }

    if (newVisibility !== 'Private' && newVisibility !== 'Public') {
      return res.status(400).json({ success: false, message: 'Invalid data.' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        visibility: newVisibility
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('user', 'username')
      .exec();

    return res.status(200).json(updatedProject);
  } catch (error) {
    return res.status(500).json(error);
  }
}
