const generateMessage = (username, text) => {
  const createdAt = new Date().getTime();
  return {
    username,
    text,
    createdAt
  };
};

module.exports = {
  generateMessage
};
