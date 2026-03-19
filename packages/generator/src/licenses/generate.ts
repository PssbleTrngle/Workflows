import createGenerator from "../factory";

export const generateLicenses = createGenerator("license", {
  helpers: {
    year: () => new Date().getUTCFullYear(),
  },
});
