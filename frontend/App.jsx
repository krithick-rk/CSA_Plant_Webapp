import { useState } from 'react';
import axios from 'axios';

function App() {
  const [image, setImage] = useState('');
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1️⃣ Convert uploaded file to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      setImage(base64Data);
      console.log('Image uploaded, length:', base64Data.length);
    };
    reader.readAsDataURL(file);
  };

  // 2️⃣ Send Base64 to backend → Plant.id API → get info
  const identifyPlant = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setPlantData(null);

    try {
      const res = await axios.post('http://localhost:5000/identify', { image });
      console.log('Backend response:', res.data);

      const suggestions = res.data.suggestions;
      if (!suggestions || suggestions.length === 0) {
        setError('No plant identified.');
        return;
      }

      const plant = suggestions[0];
      setPlantData({
        commonNames: plant.plant_details?.common_names || [],
        scientificName: plant.plant_details?.scientific_name || 'N/A',
        description: plant.plant_details?.wiki_description?.value || 'No description available',
        // Example placeholders for Indian languages (can be replaced with actual mapping)
        languages: {
          hindi: plant.plant_details?.taxonomy?.family || 'N/A',
          tamil: plant.plant_details?.taxonomy?.genus || 'N/A',
          kannada: plant.plant_details?.taxonomy?.order || 'N/A',
        },
      });
    } catch (err) {
      console.error('Error calling backend:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <h1>🌱 One-Click Plant Identifier</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button
        onClick={identifyPlant}
        disabled={!image || loading}
        style={{ marginLeft: 10, padding: '5px 10px' }}
      >
        {loading ? 'Identifying...' : 'Identify'}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {plantData && (
        <div style={{ marginTop: 20, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
          <h2>🌿 {plantData.commonNames[0] || 'Unknown Plant'}</h2>
          <p><strong>Scientific Name:</strong> {plantData.scientificName}</p>
          <p><strong>Description:</strong> {plantData.description}</p>
          <h3>Common Names in Indian Languages (Placeholders)</h3>
          <ul>
            <li><strong>Hindi:</strong> {plantData.languages.hindi}</li>
            <li><strong>Tamil:</strong> {plantData.languages.tamil}</li>
            <li><strong>Kannada:</strong> {plantData.languages.kannada}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
