export interface ProjectFile {
  name: string;
  content: string;
  url: string;
  children: string[];
  fileType: string;
  isSelectedFile: boolean;
}
