import axios from 'axios';

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org/b';
const headers = { 'User-Agent': 'PagePulse/1.0 (dev@pagepulse.app)' };

export const openLibraryApi = {
    async search(params: Record<string, any>) {
        const { data } = await axios.get(`${BASE_URL}/search.json`, { params, headers });
        return data;
    },

    async getSubject(subject: string, limit = 24) {
        const { data } = await axios.get(`${BASE_URL}/subjects/${subject}.json`, {
            params: { limit },
            headers
        });
        return data;
    },

    async getWork(workId: string) {
        const { data } = await axios.get(`${BASE_URL}/works/${workId}.json`, { headers });
        return data;
    },

    async getAuthor(authorId: string) {
        const { data } = await axios.get(`${BASE_URL}/authors/${authorId}.json`, { headers });
        return data;
    },

    async getCover(type: string, idAndSize: string) {
        return axios.get(`${COVERS_URL}/${type}/${idAndSize}`, { responseType: 'stream' });
    },
};