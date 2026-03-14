import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";

export const authHelpers = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { expires: 7, path: "/" });
  },
  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },
  removeToken: () => {
    Cookies.remove(TOKEN_KEY, { path: "/" });
  },
  decodeToken: (token: string) => {
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  },
};
