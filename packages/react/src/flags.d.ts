declare module "country-flags-svg" {
  const countries: CountryData[];
  const flagUrls: Record<string, string>;

  function findFlagUrlByCountryName(countryName: string): string;
  function findFlagUrlByNationality(nationality: string): string;
  function findFlagUrlByIso2Code(iso2Code: string): string;
  function findFlagUrlByIso3Code(iso3Code: string): string;

  interface CountryData {
    name: string;
    demonym: string;
    flag: string;
    iso2: string;
    iso3: string;
    altSpellings: string[];
  }
}
