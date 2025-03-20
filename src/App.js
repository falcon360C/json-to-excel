import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

const FileUpload = ({ onChange }) => (
  <input type="file" multiple accept=".json" onChange={onChange} />
);

const FieldInput = ({ index, path, alias, onPathChange, onAliasChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <input
      type="text"
      value={path}
      onChange={(e) => onPathChange(index, e.target.value)}
      placeholder="Enter JSON path, e.g., Steps.Params.hook.fileSensor"
      style={{ marginRight: '10px', flex: 1 }}
    />
    <input
      type="text"
      value={alias}
      onChange={(e) => onAliasChange(index, e.target.value)}
      placeholder="Enter alias for Excel column"
      style={{ flex: 1 }}
    />
  </div>
);

const DownloadLink = ({ url }) =>
  url ? (
    <a href={url} download="extracted_data.xlsx">
      Download Excel
    </a>
  ) : null;

function App() {
  const [files, setFiles] = useState([]);
  const [fields, setFields] = useState([{ path: '', alias: '' }]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileChange = (event) => {
    setFiles(event.target.files);
    setUploadMessage(`${event.target.files.length} file(s) uploaded successfully.`);
    setTimeout(() => setUploadMessage(''), 3000); // Clear message after 3 seconds
  };

  const handlePathChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].path = value;
    setFields(newFields);
  };

  const handleAliasChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].alias = value;
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { path: '', alias: '' }]);
  };

  const handleExtraction = async () => {
    if (!files.length || fields.some(field => !field.path || !field.alias)) {
      alert('Please upload JSON files and specify paths and aliases for all fields.');
      return;
    }

    const extractedData = await extractDataFromFiles(files, fields);
    if (extractedData.length > 0) {
      const excelBlob = createExcelBlob(extractedData, fields);
      const url = URL.createObjectURL(excelBlob);
      setDownloadUrl(url);
    } else {
      alert('No data extracted. Check the field paths.');
    }
  };

  const extractDataFromFiles = async (files, fields) => {
    const results = [];
    for (const file of files) {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const data = { fileName: file.name };

      fields.forEach(({ path, alias }) => {
        const value = getValueFromPath(jsonData, path.split('.'));
        data[alias] = value !== undefined ? value : 'N/A';
      });

      results.push(data);
    }
    return results;
  };

  const getValueFromPath = (obj, pathArray) => {
    console.log('Navigating path:', pathArray);
    return pathArray.reduce((acc, key) => {
      console.log('Current key:', key, 'Current value:', acc);
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  };

  const createExcelBlob = (data, fields) => {
    const sheetData = [['File Name', ...fields.map(field => field.alias)]];
    data.forEach((item) => {
      const row = [item.fileName, ...fields.map(field => item[field.alias])];
      sheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExtractedData');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/octet-stream' });
  };

  return (
    <div className="App">
      <h1>JSON to Excel Data Extractor</h1>
      <FileUpload onChange={handleFileChange} />
      {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
      {fields.map((field, index) => (
        <FieldInput
          key={index}
          index={index}
          path={field.path}
          alias={field.alias}
          onPathChange={handlePathChange}
          onAliasChange={handleAliasChange}
        />
      ))}
      <button onClick={addField}>Add Field</button>
      <button onClick={handleExtraction}>Upload and Extract</button>
      <DownloadLink url={downloadUrl} />
    </div>
    
  );

  
}


export default App;
