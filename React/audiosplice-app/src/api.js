import axios from "axios";

const api = axios.create({
  baseURL: "https://api.pamtalksaudiosplicing.com",
});

export default api;
