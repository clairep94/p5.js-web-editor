import mjml2html from 'mjml';

/** Parse template string containing mjml tags into html */
export const renderMjml = (template: string) => {
  try {
    const output = mjml2html(template);
    return output.html;
  } catch (e) {
    console.error(e);
    // fall through to null
  }

  return null;
};
