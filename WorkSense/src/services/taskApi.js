import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1/operations';

/**
 * Upload the BEFORE image for a cleaning task.
 * @param {string} taskId
 * @param {string} location
 * @param {string} imageUri - local file URI from camera
 * @param {string} token - auth token
 * @param {string} description
 */
export async function uploadBeforeImage(taskId, location, imageUri, token, description = '') {
    const form = new FormData();
    form.append('task_id', taskId);
    form.append('location', location);
    form.append('description', description);
    form.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'before.jpg',
    });

    const response = await axios.post(`${BASE_URL}/upload-before/`, form, {
        headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

/**
 * Upload the AFTER image for a cleaning task and trigger AI verification.
 * @param {string} taskId
 * @param {string} imageUri - local file URI from camera
 * @param {string} token - auth token
 * @param {number} confidenceThreshold - default 0.6
 */
export async function uploadAfterImageAndVerify(taskId, imageUri, token, confidenceThreshold = 0.6) {
    const form = new FormData();
    form.append('task_id', taskId);
    form.append('confidence_threshold', String(confidenceThreshold));
    form.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'after.jpg',
    });

    const response = await axios.post(`${BASE_URL}/upload-after-verify/`, form, {
        headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

/**
 * Fetch details for a single cleaning task.
 * @param {string} taskId
 * @param {string} token
 */
export async function getTaskDetails(taskId, token) {
    const response = await axios.get(`${BASE_URL}/task/${taskId}/`, {
        headers: { Authorization: `Token ${token}` },
    });
    return response.data;
}

/**
 * Fetch all cleaning tasks for the current worker.
 * @param {string} token
 */
export async function getWorkerTasks(token) {
    const response = await axios.get(`${BASE_URL}/my-tasks/`, {
        headers: { Authorization: `Token ${token}` },
    });
    return response.data;
}

/**
 * Fetch performance metrics for the current worker.
 * @param {string} token
 */
export async function getWorkerMetrics(token) {
    const response = await axios.get(`${BASE_URL}/my-metrics/`, {
        headers: { Authorization: `Token ${token}` },
    });
    return response.data;
}
