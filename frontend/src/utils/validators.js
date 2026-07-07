export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^[0-9]{10,15}$/;
  return regex.test(phone.replace(/[\s-]/g, ""));
};

export const validateRequired = (value) => {
  return (
    value !== null && value !== undefined && value.toString().trim() !== ""
  );
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateNumber = (value) => {
  return !isNaN(value) && value !== "";
};
