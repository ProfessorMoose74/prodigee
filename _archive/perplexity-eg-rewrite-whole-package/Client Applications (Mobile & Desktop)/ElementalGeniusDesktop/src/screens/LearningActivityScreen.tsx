import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
// Assume a thunk `fetchActivity` exists in a learningSlice
// import { fetchActivity } from '../store/slices/learningSlice'; 
import Character from '../components/Character'; // 3D Character component
import styled from 'styled-components';

const ActivityContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const LearningActivityScreen: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const dispatch = useDispatch<AppDispatch>();
  // const { currentActivity, status } = useSelector((state: RootState) => state.learning);

  useEffect(() => {
    if (type) {
      // dispatch(fetchActivity(type));
    }
  }, [type, dispatch]);

  const handleVoiceInput = async () => {
    // 1. Use Web Audio API to record audio
    // 2. Create FormData and append the audio blob
    // 3. Call voiceApi.recognize(formData)
    // 4. Handle response from backend
  };

  return (
    <ActivityContainer>
      <h1>{type?.toUpperCase()} Activity</h1>
      <Character characterName="Professor Al" />
      {/* Display activity instructions from currentActivity */}
      <button onClick={handleVoiceInput}>Record Answer</button>
    </ActivityContainer>
  );
};

export default LearningActivityScreen;