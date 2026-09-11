module.exports = {
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockResolvedValue({ data: new Float32Array(384) })
  ),
};
