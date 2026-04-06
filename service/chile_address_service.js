import axios from 'axios';

const DPA_BASE_URL = 'https://apis.digital.gob.cl/dpa';

const normalizeSector = (item = {}) => ({
  code: item?.codigo ?? '',
  name: item?.nombre ?? '',
  parentCode: item?.codigo_padre ?? '',
  raw: item,
});

const fetchChileRegions = async () => {
  const response = await axios.get(`${DPA_BASE_URL}/regiones`);
  const regions = Array.isArray(response.data) ? response.data.map(normalizeSector) : [];
  console.log('[fetchChileRegions] response count:', regions.length);
  return regions.sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

const fetchChileCommunes = async (regionCode) => {
  if (!regionCode) {
    return [];
  }

  const response = await axios.get(`${DPA_BASE_URL}/regiones/${regionCode}/comunas`);
  const communes = Array.isArray(response.data) ? response.data.map(normalizeSector) : [];
  console.log('[fetchChileCommunes] regionCode:', regionCode, 'count:', communes.length);
  return communes.sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export {
  fetchChileCommunes,
  fetchChileRegions,
};
