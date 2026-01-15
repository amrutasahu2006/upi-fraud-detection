const validateRegisterInput = (data) => {
  const { username, email, password, confirmPassword } = data;
  const errors = {};

  // Username validation
  if (!username || username.trim() === '') {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (username.length > 30) {
    errors.username = 'Username must not exceed 30 characters';
  }

  // Email validation
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Email must be valid';
    }
  }

  // Password validation
  if (!password || password.trim() === '') {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    errors.confirmPassword = 'Confirm password is required';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateLoginInput = (data) => {
  const { email, password } = data;
  const errors = {};

  // Email validation
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  }

  // Password validation
  if (!password || password.trim() === '') {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};