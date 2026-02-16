import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Dr. Heggerty's 35-week phonemic awareness curriculum structure
// Based on the comprehensive curriculum design
const HEGGERTY_CURRICULUM = {
  totalWeeks: 35,
  ageGroups: ['3-5', '6-8', '9-10'],
  dailyStructure: {
    durationMinutes: 8,
    components: [
      { name: 'Warm-up', duration: 1, description: 'Review and activate prior knowledge' },
      { name: 'Skill Introduction', duration: 3, description: 'Explicit instruction of target skill' },
      { name: 'Guided Practice', duration: 3, description: 'Teacher-led practice with scaffolding' },
      { name: 'Assessment', duration: 1, description: 'Quick formative assessment' }
    ]
  },
  skillProgression: {
    rhymingRecognition: { weeks: [1], ageGroup: '3-5', handMotions: { rhyme_clap: 'Clap hands together when words rhyme' } },
    rhymeProduction: { weeks: [2], ageGroup: '3-5', handMotions: { rhyme_stomp: 'Stomp feet for each rhyming word' } },
    syllableAwareness: { weeks: [3], ageGroup: '3-5', handMotions: { syllable_clap: 'Clap syllables in names' } },
    onsetRimeBlending: { weeks: [4], ageGroup: '6-8', handMotions: { onset_blend: 'Blend onset-rime with pictures' } },
    phonemeIsolationInitial: { weeks: [5], ageGroup: '6-8', handMotions: { sound_stretch: 'Sound stretching' } },
    cvcBlendingMastery: { weeks: [10], ageGroup: '6-8', handMotions: { blending_robot: 'Blending robot game' } },
    phonemeSegmentation: { weeks: [15], ageGroup: '6-8', handMotions: { sound_boxes: 'Use sound boxes' } },
    phonemeAddition: { weeks: [20], ageGroup: '6-8', handMotions: { sound_addition: 'Add sounds to make words' } },
    phonemeDeletion: { weeks: [25], ageGroup: '9-10', handMotions: { deletion_practice: 'Remove first sounds' } },
    phonemeSubstitution: { weeks: [30], ageGroup: '9-10', handMotions: { substitution_chain: 'Chain substitution activities' } },
    comprehensiveMastery: { weeks: [35], ageGroup: '9-10', handMotions: { mastery_showcase: 'Showcase skills' } }
  },
  assessmentProgression: {
    'weeks_1_5': { focus: 'Rhyming and syllable awareness', masteryTarget: 0.70, interventionThreshold: 0.50 },
    'weeks_6_10': { focus: 'Onset-rime and initial sound isolation', masteryTarget: 0.75, interventionThreshold: 0.55 },
    'weeks_11_15': { focus: 'CVC blending and segmentation', masteryTarget: 0.80, interventionThreshold: 0.60 },
    'weeks_16_20': { focus: 'Complex blending and phoneme addition', masteryTarget: 0.75, interventionThreshold: 0.55 },
    'weeks_21_25': { focus: 'Phoneme deletion', masteryTarget: 0.70, interventionThreshold: 0.50 },
    'weeks_26_30': { focus: 'Phoneme substitution', masteryTarget: 0.70, interventionThreshold: 0.50 },
    'weeks_31_35': { focus: 'Comprehensive application', masteryTarget: 0.85, interventionThreshold: 0.65 }
  },
  differentiationStrategies: {
    below_level: [
      'Reduce number of items',
      'Provide visual supports',
      'Use concrete manipulatives',
      'Increase wait time',
      'Offer choice in response mode'
    ],
    on_level: [
      'Follow standard progression',
      'Maintain pace',
      'Provide peer collaboration',
      'Include extension when ready'
    ],
    above_level: [
      'Accelerate through mastered skills',
      'Add complexity to tasks',
      'Include multisyllabic words',
      'Integrate with reading/writing',
      'Peer tutoring opportunities'
    ]
  }
};

// Extract skills from curriculum for compatibility
const HEGGERTY_SKILLS = {};
Object.entries(HEGGERTY_CURRICULUM.skillProgression).forEach(([skill, config]) => {
  HEGGERTY_SKILLS[skill] = {
    weeks: config.weeks,
    ageGroup: config.ageGroup,
    handMotions: Object.values(config.handMotions)[0] || 'Standard gestures'
  };
});

// Async thunks for curriculum management
export const loadWeekCurriculum = createAsyncThunk(
  'curriculum/loadWeek',
  async (weekNumber, { rejectWithValue }) => {
    try {
      const response = await api.getWeekCurriculum(weekNumber);
      return {
        weekNumber,
        data: response,
      };
    } catch (error) {
      console.error('Load week curriculum error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load curriculum');
    }
  }
);

export const loadActivityContent = createAsyncThunk(
  'curriculum/loadActivity',
  async ({ activityType, weekNumber, childAge }, { rejectWithValue }) => {
    try {
      const response = await api.getActivityDetails(activityType);
      
      // Adapt content for child's age and week
      const adaptedContent = adaptContentForAge(response, childAge, weekNumber);
      
      return {
        activityType,
        weekNumber,
        content: adaptedContent,
      };
    } catch (error) {
      console.error('Load activity content error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load activity');
    }
  }
);

export const generateNurseryRhyme = createAsyncThunk(
  'curriculum/generateNurseryRhyme',
  async (weekNumber, { rejectWithValue }) => {
    try {
      // Get week curriculum which includes nursery rhyme
      const response = await api.getWeekCurriculum(weekNumber);
      return response.nursery_rhyme;
    } catch (error) {
      console.error('Generate nursery rhyme error:', error);
      return rejectWithValue('Failed to load nursery rhyme');
    }
  }
);

// Helper function to adapt content for child's age
const adaptContentForAge = (content, childAge, weekNumber) => {
  const ageGroup = getAgeGroup(childAge);
  
  return {
    ...content,
    difficulty_adapted: adaptDifficultyForAge(content.difficulty, ageGroup),
    instructions_adapted: adaptInstructionsForAge(content.instructions, ageGroup),
    examples_adapted: adaptExamplesForAge(content.examples, ageGroup, weekNumber),
    interaction_style: getInteractionStyleForAge(ageGroup),
  };
};

const getAgeGroup = (age) => {
  if (age <= 4) return 'preschool';
  if (age <= 6) return 'kindergarten';
  return 'elementary';
};

const adaptDifficultyForAge = (baseDifficulty, ageGroup) => {
  const adjustments = {
    preschool: { easy: 'very_easy', moderate: 'easy', challenging: 'moderate' },
    kindergarten: { easy: 'easy', moderate: 'moderate', challenging: 'moderate' },
    elementary: { easy: 'easy', moderate: 'moderate', challenging: 'challenging' },
  };
  
  return adjustments[ageGroup]?.[baseDifficulty] || baseDifficulty;
};

const adaptInstructionsForAge = (instructions, ageGroup) => {
  const vocabulary = {
    preschool: { simple: true, maxWords: 8 },
    kindergarten: { simple: true, maxWords: 12 },
    elementary: { simple: false, maxWords: 16 },
  };
  
  // Simplify language based on age group
  return instructions; // Placeholder - would implement language adaptation
};

const adaptExamplesForAge = (examples, ageGroup, weekNumber) => {
  // Filter examples appropriate for age and week
  return examples; // Placeholder - would implement example filtering
};

const getInteractionStyleForAge = (ageGroup) => {
  return {
    preschool: { visual: true, gestural: true, verbal: 'simple', pace: 'slow' },
    kindergarten: { visual: true, gestural: true, verbal: 'moderate', pace: 'moderate' },
    elementary: { visual: true, gestural: false, verbal: 'complex', pace: 'normal' },
  };
};

const initialState = {
  // Current curriculum state
  currentWeek: 1,
  currentSkills: [],
  weeklyContent: {},
  
  // Activity state
  currentActivity: null,
  activityContent: {},
  
  // Nursery rhymes
  nurseryRhymes: {},
  currentNurseryRhyme: null,
  
  // Progress tracking
  skillProgress: {
    rhyming: 0,
    onsetFluency: 0,
    blending: 0,
    isolatingFinal: 0,
    isolatingMedial: 0,
    segmenting: 0,
    addingPhonemes: 0,
    deletingPhonemes: 0,
    substitutingPhonemes: 0,
  },
  
  // Mastery tracking
  masteredSkills: new Set(),
  strugglingSkills: new Set(),
  readyForAdvancement: false,
  
  // Age adaptations
  childAge: null,
  ageGroup: null,
  adaptationSettings: null,
  
  // Assessment data
  weeklyAssessments: {},
  skillAssessments: {},
  recommendedActivities: [],
  
  // Content customization
  difficultyLevel: 'auto', // 'auto', 'easy', 'moderate', 'challenging'
  pacePreference: 'moderate', // 'slow', 'moderate', 'fast'
  interactionStyle: 'balanced', // 'visual', 'auditory', 'kinesthetic', 'balanced'
  
  // Loading states
  isLoadingWeek: false,
  isLoadingActivity: false,
  isLoadingNurseryRhyme: false,
  
  // Errors
  error: null,
  activityError: null,
  
  // Heggerty skill definitions
  skillDefinitions: HEGGERTY_SKILLS,
  
  // Content library
  contentLibrary: {
    activities: {},
    songs: {},
    games: {},
    assessments: {},
  },
};

const curriculumSlice = createSlice({
  name: 'curriculum',
  initialState,
  reducers: {
    // Week management
    setCurrentWeek: (state, action) => {
      state.currentWeek = action.payload;
      state.currentSkills = getSkillsForWeek(action.payload);
      state.readyForAdvancement = false;
    },

    advanceWeek: (state) => {
      if (state.currentWeek < 35 && state.readyForAdvancement) {
        state.currentWeek += 1;
        state.currentSkills = getSkillsForWeek(state.currentWeek);
        state.readyForAdvancement = false;
      }
    },

    // Activity management
    setCurrentActivity: (state, action) => {
      state.currentActivity = action.payload;
    },

    clearCurrentActivity: (state) => {
      state.currentActivity = null;
    },

    // Progress updates
    updateSkillProgress: (state, action) => {
      const { skill, progress } = action.payload;
      if (skill in state.skillProgress) {
        state.skillProgress[skill] = Math.max(0, Math.min(100, progress));
        
        // Check for mastery (90%+ progress)
        if (progress >= 90) {
          state.masteredSkills.add(skill);
          state.strugglingSkills.delete(skill);
        }
        
        // Check for struggling (below 30% after multiple attempts)
        if (progress < 30 && action.payload.attempts > 5) {
          state.strugglingSkills.add(skill);
        }
      }
    },

    markSkillMastered: (state, action) => {
      const skill = action.payload;
      state.masteredSkills.add(skill);
      state.skillProgress[skill] = 100;
      state.strugglingSkills.delete(skill);
    },

    markSkillStruggling: (state, action) => {
      const skill = action.payload;
      state.strugglingSkills.add(skill);
    },

    // Advancement readiness
    checkAdvancementReadiness: (state) => {
      const currentWeekSkills = getSkillsForWeek(state.currentWeek);
      const masteredCurrentSkills = currentWeekSkills.filter(skill => 
        state.masteredSkills.has(skill) || state.skillProgress[skill] >= 80
      );
      
      // Ready if 80% of current week skills are mastered
      state.readyForAdvancement = masteredCurrentSkills.length >= (currentWeekSkills.length * 0.8);
    },

    // Age and adaptation settings
    setChildAge: (state, action) => {
      state.childAge = action.payload;
      state.ageGroup = getAgeGroup(action.payload);
      state.adaptationSettings = createAdaptationSettings(state.ageGroup);
    },

    updateAdaptationSettings: (state, action) => {
      state.adaptationSettings = {
        ...state.adaptationSettings,
        ...action.payload,
      };
    },

    // Difficulty and pace
    setDifficultyLevel: (state, action) => {
      state.difficultyLevel = action.payload;
    },

    setPacePreference: (state, action) => {
      state.pacePreference = action.payload;
    },

    setInteractionStyle: (state, action) => {
      state.interactionStyle = action.payload;
    },

    // Assessment management
    addWeeklyAssessment: (state, action) => {
      const { week, assessment } = action.payload;
      state.weeklyAssessments[week] = assessment;
    },

    addSkillAssessment: (state, action) => {
      const { skill, assessment } = action.payload;
      if (!state.skillAssessments[skill]) {
        state.skillAssessments[skill] = [];
      }
      state.skillAssessments[skill].push(assessment);
    },

    updateRecommendations: (state, action) => {
      state.recommendedActivities = action.payload;
    },

    // Content library management
    addToContentLibrary: (state, action) => {
      const { type, key, content } = action.payload;
      if (state.contentLibrary[type]) {
        state.contentLibrary[type][key] = content;
      }
    },

    // Error handling
    setCurriculumError: (state, action) => {
      state.error = action.payload;
    },

    clearCurriculumError: (state) => {
      state.error = null;
    },

    setActivityError: (state, action) => {
      state.activityError = action.payload;
    },

    clearActivityError: (state) => {
      state.activityError = null;
    },

    // Reset curriculum state
    resetCurriculum: (state) => {
      return {
        ...initialState,
        childAge: state.childAge,
        ageGroup: state.ageGroup,
        adaptationSettings: state.adaptationSettings,
      };
    },
  },

  extraReducers: (builder) => {
    builder
      // Load week curriculum
      .addCase(loadWeekCurriculum.pending, (state) => {
        state.isLoadingWeek = true;
        state.error = null;
      })
      .addCase(loadWeekCurriculum.fulfilled, (state, action) => {
        state.isLoadingWeek = false;
        const { weekNumber, data } = action.payload;
        state.weeklyContent[weekNumber] = data;
        
        if (weekNumber === state.currentWeek) {
          state.currentSkills = data.active_skills || [];
        }
      })
      .addCase(loadWeekCurriculum.rejected, (state, action) => {
        state.isLoadingWeek = false;
        state.error = action.payload;
      })

      // Load activity content
      .addCase(loadActivityContent.pending, (state) => {
        state.isLoadingActivity = true;
        state.activityError = null;
      })
      .addCase(loadActivityContent.fulfilled, (state, action) => {
        state.isLoadingActivity = false;
        const { activityType, weekNumber, content } = action.payload;
        const key = `${activityType}_${weekNumber}`;
        state.activityContent[key] = content;
      })
      .addCase(loadActivityContent.rejected, (state, action) => {
        state.isLoadingActivity = false;
        state.activityError = action.payload;
      })

      // Generate nursery rhyme
      .addCase(generateNurseryRhyme.pending, (state) => {
        state.isLoadingNurseryRhyme = true;
      })
      .addCase(generateNurseryRhyme.fulfilled, (state, action) => {
        state.isLoadingNurseryRhyme = false;
        state.currentNurseryRhyme = action.payload;
        state.nurseryRhymes[state.currentWeek] = action.payload;
      })
      .addCase(generateNurseryRhyme.rejected, (state, action) => {
        state.isLoadingNurseryRhyme = false;
        state.error = action.payload;
      });
  },
});

// Helper functions
const getSkillsForWeek = (weekNumber) => {
  const activeSkills = [];
  
  Object.entries(HEGGERTY_SKILLS).forEach(([skill, config]) => {
    if (config.weeks.includes(weekNumber)) {
      activeSkills.push(skill);
    }
  });
  
  return activeSkills;
};

const createAdaptationSettings = (ageGroup) => {
  const settings = {
    preschool: {
      maxSessionTime: 15, // minutes
      breakInterval: 5, // minutes
      repetitionsNeeded: 3,
      visualSupport: 'high',
      gestureSupport: 'high',
      verbalComplexity: 'simple',
    },
    kindergarten: {
      maxSessionTime: 20,
      breakInterval: 7,
      repetitionsNeeded: 2,
      visualSupport: 'medium',
      gestureSupport: 'medium',
      verbalComplexity: 'moderate',
    },
    elementary: {
      maxSessionTime: 25,
      breakInterval: 10,
      repetitionsNeeded: 2,
      visualSupport: 'low',
      gestureSupport: 'low',
      verbalComplexity: 'complex',
    },
  };
  
  return settings[ageGroup] || settings.kindergarten;
};

export const {
  setCurrentWeek,
  advanceWeek,
  setCurrentActivity,
  clearCurrentActivity,
  updateSkillProgress,
  markSkillMastered,
  markSkillStruggling,
  checkAdvancementReadiness,
  setChildAge,
  updateAdaptationSettings,
  setDifficultyLevel,
  setPacePreference,
  setInteractionStyle,
  addWeeklyAssessment,
  addSkillAssessment,
  updateRecommendations,
  addToContentLibrary,
  setCurriculumError,
  clearCurriculumError,
  setActivityError,
  clearActivityError,
  resetCurriculum,
} = curriculumSlice.actions;

export default curriculumSlice.reducer;