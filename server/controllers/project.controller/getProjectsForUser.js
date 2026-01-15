import Project from '../../models/project';
import { User } from '../../models/user';
import { toApi as toApiProjectObject } from '../../domain-objects/Project';

/**
 * Fetches projects for the username in the request.
 * Handles errors.
 * Returns a success response based on the provided `mapProjectsToResponse` function.
 */
const createCoreHandler = (mapProjectsToResponse) => async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit } = req.query;

    if (!username) {
      res.status(422).json({ message: 'Username not provided' });
      return;
    }

    const user = await User.findByUsername(username);

    if (!user) {
      res
        .status(404)
        .json({ message: 'User with that username does not exist.' });
      return;
    }

    const usePagination = page !== undefined && limit !== undefined;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;

    const query = Project.find({ user: user._id })
      .sort('-createdAt')
      .select('name files id createdAt updatedAt');

    if (usePagination) {
      query.skip((page - 1) * limit).limit(limit);
    }

    const projects = await query.exec();

    const totalProjects = usePagination
      ? await Project.countDocuments({ user: user._id })
      : projects?.length;

    const response = {
      projects: mapProjectsToResponse(projects),
      ...(usePagination && {
        metadata: {
          currentPage: parsedPage || 1,
          totalPages: Math.ceil(totalProjects / parsedLimit) || 1,
          totalProjects,
          limit: parsedLimit,
          hasPagination: true
        }
      })
    };

    const canViewPrivate = req.user && req.user._id.equals(user._id);

    const filter = { user: user._id };
    if (!canViewPrivate) {
      filter.visibility = { $ne: 'Private' };
    }

    // must fix merge conflicts later here
    // projects = await Project.find(filter)
    //   .sort('-createdAt')
    //   .select('name files id createdAt updatedAt visibility')
    //   .exec();

    // cresponse = mapProjectsToResponse(projects);
    // res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

/**
 * Main handler returns an array of project objects.
 */
const getProjectsForUser = createCoreHandler((projects) => projects);
export default getProjectsForUser;

/**
 * Handler for the public API returns an object with property `sketches`.
 * The array of sketches contains the `id` and `name` only.
 */
export const apiGetProjectsForUser = createCoreHandler((projects) => ({
  sketches: projects.map((p) => toApiProjectObject(p))
}));
