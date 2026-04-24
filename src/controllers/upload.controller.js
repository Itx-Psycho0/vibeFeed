export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    });
  } catch (error) {
    next(error);
  }
};
