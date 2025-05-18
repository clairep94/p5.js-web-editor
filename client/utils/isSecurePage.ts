const isSecurePage = ():boolean => window.location.protocol === 'https:';

export default isSecurePage;
