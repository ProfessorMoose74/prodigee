// LessonScreen.js
import React, { useState } from 'react';
import { View, Button, Text, TextInput } from 'react-native';
import ApiService from './ApiService';
// A conceptual voice streaming service
import VoiceStreamer from './VoiceStreamingService'; 

const LessonScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [characterResponse, setCharacterResponse] = useState('');
  const [transcription, setTranscription] = useState('');

  const handleSendPrompt = async () => {
    try {
      const response = await ApiService.getCharacterResponse(prompt, 'Miss McGee');
      setCharacterResponse(response.data.text);
      // Logic to play response.data.audio_url would go here
    } catch (error) {
      setCharacterResponse('Sorry, an error occurred.');
    }
  };

  const handleStartRecording = () => {
    // The voice streamer sends audio to the backend and gets transcriptions back
    VoiceStreamer.start(
        (transcribedText) => setTranscription(transcribedText),
        (error) => console.error(error)
    );
  };
  
  const handleStopRecording = () => {
    VoiceStreamer.stop();
  };

  return (
    <View>
      <Text>Talk to Miss McGee</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Type a message..."
      />
      <Button title="Send Text" onPress={handleSendPrompt} />
      
      <Button title="Start Recording" onPress={handleStartRecording} />
      <Button title="Stop Recording" onPress={handleStopRecording} />

      <Text>Transcription: {transcription}</Text>
      <Text>Miss McGee says: {characterResponse}</Text>
    </View>
  );
};

export default LessonScreen;