export const mockResponse = {
  disease: "Tomato_Early_blight",
  display_name: "Tomato Early Blight",
  confidence: 87.3,
  status: "confident",
  top_predictions: [
    { label: "Tomato Early Blight", confidence: 87.3 },
    { label: "Tomato Healthy", confidence: 9.1 },
  ],
  guidance: {
    symptoms: ["Dark concentric rings on older leaves"],
    treatment: ["Remove infected leaves", "Apply copper-based fungicide"],
    prevention: ["Water at the base of the plant", "Rotate crops yearly"],
  },
};

export const mockUncertainResponse = {
  disease: "Tomato_Early_blight",
  display_name: "Tomato Early Blight",
  confidence: 41.2,
  status: "uncertain",
  top_predictions: [
    { label: "Tomato Early Blight", confidence: 41.2 },
    { label: "Tomato Late Blight", confidence: 34.8 },
  ],
  guidance: {
    symptoms: [],
    treatment: [],
    prevention: [],
  },
};
