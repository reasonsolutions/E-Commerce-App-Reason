import axios from "axios";
import { url } from "./url";

const axiosInstance = axios.create({
  baseURL: url,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;