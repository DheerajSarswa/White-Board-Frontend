import { createContext } from "react";

const authContext = createContext({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  register: () => {},
  login: () => {},
  logout: () => {},
});

export default authContext;
