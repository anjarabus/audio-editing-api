import axios from "axios";

const api = axios.create({
  // baseURL: "https://api.pamtalksaudiosplicing.com", //prod mode
  baseURL: "http://localhost:8000", //dev mode
});

export default api;
