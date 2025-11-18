const axios = require("axios");

const BASE_URL = "https://api.libreview.io/llu";

class LibreLinkClient {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
    this.token = null;
    this.userId = null;
  }

  async login() {
    try {
      console.log("📧 Intentando login en LibreLinkClient con credenciales:");
      console.log({
        email: this.email,
        password: this.password 
      });

      const resp = await axios.post(`${BASE_URL}/auth/login`, {
        email: this.email,
        password: this.password,
      });

      this.token = resp.data.data.authTicket.token;
      this.userId = resp.data.data.user.userId;

      console.log("🔐 Login LibreLinkClient exitoso, token recibido:", this.token?.slice(0, 10) + "...");
      return this.token;
    } catch (e) {
      console.error("❌ Login falló en LibreLinkClient:", e.message);
      throw new Error("Login falló");
    }
  }

  async getConnections() {
    try {
      const resp = await axios.get(`${BASE_URL}/connections`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return resp.data.data;
    } catch (e) {
      console.error("❌ No se pudieron obtener conexiones:", e.message);
      throw new Error("No se pudieron obtener conexiones");
    }
  }

  async read(connectionId) {
    try {
      const resp = await axios.get(`${BASE_URL}/sensors/${connectionId}/graph`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const g = resp.data.data.graphData.at(-1);
      return {
        value: g.ValueInMgPerDl,
        timestamp: g.Timestamp,
        type: "sensor"
      };
    } catch (e) {
      console.error("❌ No se pudo leer el sensor:", e.message);
      throw new Error("No se pudo leer el sensor");
    }
  }
}

module.exports = LibreLinkClient;
