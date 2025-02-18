export const RegexPatterns = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
  PHONE_NUMBER: /^\+?[1-9]\d{1,14}$/, 
  USERNAME: /^[a-zA-Z0-9_]{3,16}$/,
};