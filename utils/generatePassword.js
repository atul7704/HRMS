function generatePassword(pan, dob) {
  if (!pan || !dob) {
    throw new Error('PAN and DOB are required to generate password');
  }

  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid DOB format');
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${pan.toLowerCase()}${month}${year}`;
}

module.exports = generatePassword;