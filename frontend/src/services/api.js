const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro na comunicacao com a API.");
  }

  return data;
};

export const api = {
  get: (path) => request(path),
  post: (path, body, options = {}) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),
  put: (path, body, options = {}) =>
    request(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (path, options = {}) =>
    request(path, {
      method: "DELETE",
      ...options,
    }),
  upload: async (path, file) => {
    const formData = new FormData();
    formData.append("arquivo", file);

    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao enviar arquivo.");
    }

    return data;
  },
};
