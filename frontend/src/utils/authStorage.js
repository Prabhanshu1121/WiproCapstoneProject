const TOKEN_KEY = "smartbank_token";
const PROFILE_KEY = "smartbank_profile";

export const authStorage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  setToken: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  getProfile: () => sessionStorage.getItem(PROFILE_KEY),
  setProfile: (profile) => sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile)),
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }
};
