import {AvatarCustomization} from './Avatar';

export interface AnimationState {
  type:
    | 'idle'
    | 'waving'
    | 'clapping'
    | 'cheering'
    | 'jumping'
    | 'dancing'
    | 'thinking'
    | 'celebrating'
    | 'sign_hello'
    | 'sign_good'
    | 'sign_yes'
    | 'sign_no'
    | 'sign_please'
    | 'sign_thankyou'
    | 'sign_help'
    | 'sign_listen';
  duration: number;
  loop: boolean;
  intensity: 'low' | 'medium' | 'high';
}

export interface AnimatedAvatarProps {
  avatar: AvatarCustomization;
  animation: AnimationState;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  interactive?: boolean;
  showEmotions?: boolean;
  arMode?: boolean; // Future AR/VR preparation
}

export interface AvatarBone {
  id: string;
  parentId?: string;
  position: {x: number; y: number};
  rotation: number;
  scale: {x: number; y: number};
  children?: string[];
}

export interface AvatarSkeleton {
  head: AvatarBone;
  neck: AvatarBone;
  torso: AvatarBone;
  leftShoulder: AvatarBone;
  leftUpperArm: AvatarBone;
  leftLowerArm: AvatarBone;
  leftHand: AvatarBone;
  rightShoulder: AvatarBone;
  rightUpperArm: AvatarBone;
  rightLowerArm: AvatarBone;
  rightHand: AvatarBone;
  leftHip: AvatarBone;
  leftUpperLeg: AvatarBone;
  leftLowerLeg: AvatarBone;
  leftFoot: AvatarBone;
  rightHip: AvatarBone;
  rightUpperLeg: AvatarBone;
  rightLowerLeg: AvatarBone;
  rightFoot: AvatarBone;
}

export interface AnimationKeyframe {
  time: number; // 0-1 (percentage of animation)
  bones: Partial<
    Record<
      keyof AvatarSkeleton,
      {
        rotation?: number;
        position?: {x: number; y: number};
        scale?: {x: number; y: number};
      }
    >
  >;
  emotions?: {
    eyeExpression: 'normal' | 'happy' | 'excited' | 'focused';
    mouthExpression: 'smile' | 'open' | 'laugh' | 'neutral';
    eyebrowExpression: 'normal' | 'raised' | 'focused';
  };
}

export interface AnimationSequence {
  name: string;
  keyframes: AnimationKeyframe[];
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  duration: number;
  loop: boolean;
}

// Pre-defined animation sequences
export const AVATAR_ANIMATIONS: Record<string, AnimationSequence> = {
  idle: {
    name: 'idle',
    duration: 3000,
    loop: true,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          torso: {rotation: 0},
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.5,
        bones: {
          torso: {rotation: 1},
          head: {rotation: -1},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 1,
        bones: {
          torso: {rotation: 0},
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  waving: {
    name: 'waving',
    duration: 2000,
    loop: true,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightShoulder: {rotation: 0},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.25,
        bones: {
          rightShoulder: {rotation: 10},
          rightUpperArm: {rotation: -30},
          rightLowerArm: {rotation: -70},
          rightHand: {rotation: 15},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.5,
        bones: {
          rightShoulder: {rotation: 0},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.75,
        bones: {
          rightShoulder: {rotation: -10},
          rightUpperArm: {rotation: -60},
          rightLowerArm: {rotation: -110},
          rightHand: {rotation: -15},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          rightShoulder: {rotation: 0},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
    ],
  },

  clapping: {
    name: 'clapping',
    duration: 1500,
    loop: true,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          leftUpperArm: {rotation: 15},
          leftLowerArm: {rotation: -75},
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: 75},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.3,
        bones: {
          leftUpperArm: {rotation: 5},
          leftLowerArm: {rotation: -85},
          rightUpperArm: {rotation: -5},
          rightLowerArm: {rotation: 85},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.5,
        bones: {
          leftUpperArm: {rotation: 15},
          leftLowerArm: {rotation: -75},
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: 75},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.8,
        bones: {
          leftUpperArm: {rotation: 5},
          leftLowerArm: {rotation: -85},
          rightUpperArm: {rotation: -5},
          rightLowerArm: {rotation: 85},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          leftUpperArm: {rotation: 15},
          leftLowerArm: {rotation: -75},
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: 75},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
    ],
  },

  cheering: {
    name: 'cheering',
    duration: 2500,
    loop: false,
    easing: 'bounce',
    keyframes: [
      {
        time: 0,
        bones: {
          leftUpperArm: {rotation: -45},
          leftLowerArm: {rotation: -135},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -135},
          torso: {position: {x: 0, y: 0}},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'open',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.3,
        bones: {
          leftUpperArm: {rotation: -60},
          leftLowerArm: {rotation: -120},
          rightUpperArm: {rotation: -60},
          rightLowerArm: {rotation: -120},
          torso: {position: {x: 0, y: -10}},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.6,
        bones: {
          leftUpperArm: {rotation: -30},
          leftLowerArm: {rotation: -150},
          rightUpperArm: {rotation: -30},
          rightLowerArm: {rotation: -150},
          torso: {position: {x: 0, y: 0}},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          leftUpperArm: {rotation: -45},
          leftLowerArm: {rotation: -135},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -135},
          torso: {position: {x: 0, y: 0}},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
    ],
  },

  jumping: {
    name: 'jumping',
    duration: 1200,
    loop: false,
    easing: 'ease-out',
    keyframes: [
      {
        time: 0,
        bones: {
          torso: {position: {x: 0, y: 0}},
          leftUpperLeg: {rotation: 10},
          leftLowerLeg: {rotation: -20},
          rightUpperLeg: {rotation: 10},
          rightLowerLeg: {rotation: -20},
          leftUpperArm: {rotation: -30},
          rightUpperArm: {rotation: 30},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'open',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.4,
        bones: {
          torso: {position: {x: 0, y: -20}},
          leftUpperLeg: {rotation: -5},
          leftLowerLeg: {rotation: 5},
          rightUpperLeg: {rotation: -5},
          rightLowerLeg: {rotation: 5},
          leftUpperArm: {rotation: -60},
          rightUpperArm: {rotation: 60},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.7,
        bones: {
          torso: {position: {x: 0, y: -10}},
          leftUpperLeg: {rotation: 0},
          leftLowerLeg: {rotation: 0},
          rightUpperLeg: {rotation: 0},
          rightLowerLeg: {rotation: 0},
          leftUpperArm: {rotation: -45},
          rightUpperArm: {rotation: 45},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          torso: {position: {x: 0, y: 0}},
          leftUpperLeg: {rotation: 5},
          leftLowerLeg: {rotation: -10},
          rightUpperLeg: {rotation: 5},
          rightLowerLeg: {rotation: -10},
          leftUpperArm: {rotation: 0},
          rightUpperArm: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  celebrating: {
    name: 'celebrating',
    duration: 3000,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          torso: {position: {x: 0, y: 0}, rotation: 0},
          leftUpperArm: {rotation: -45},
          leftLowerArm: {rotation: -90},
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.2,
        bones: {
          torso: {position: {x: 0, y: -15}, rotation: 5},
          leftUpperArm: {rotation: -75},
          leftLowerArm: {rotation: -120},
          rightUpperArm: {rotation: -75},
          rightLowerArm: {rotation: -120},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.4,
        bones: {
          torso: {position: {x: 0, y: 0}, rotation: -5},
          leftUpperArm: {rotation: -30},
          leftLowerArm: {rotation: -60},
          rightUpperArm: {rotation: -30},
          rightLowerArm: {rotation: -60},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.6,
        bones: {
          torso: {position: {x: 0, y: -10}, rotation: 3},
          leftUpperArm: {rotation: -60},
          leftLowerArm: {rotation: -100},
          rightUpperArm: {rotation: -60},
          rightLowerArm: {rotation: -100},
        },
        emotions: {
          eyeExpression: 'excited',
          mouthExpression: 'laugh',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          torso: {position: {x: 0, y: 0}, rotation: 0},
          leftUpperArm: {rotation: 0},
          leftLowerArm: {rotation: 0},
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  // Sign Language Animations
  sign_hello: {
    name: 'sign_hello',
    duration: 2000,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.5,
        bones: {
          rightUpperArm: {rotation: -30},
          rightLowerArm: {rotation: -70},
          rightHand: {rotation: 15},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
    ],
  },

  sign_good: {
    name: 'sign_good',
    duration: 1500,
    loop: false,
    easing: 'ease-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: -30},
          rightHand: {rotation: 90}, // Thumbs up position
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.5,
        bones: {
          rightUpperArm: {rotation: -10},
          rightLowerArm: {rotation: -40},
          rightHand: {rotation: 90},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: -30},
          rightHand: {rotation: 90},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
    ],
  },

  sign_yes: {
    name: 'sign_yes',
    duration: 1200,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.3,
        bones: {
          head: {rotation: 10},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.6,
        bones: {
          head: {rotation: -5},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 1,
        bones: {
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  sign_no: {
    name: 'sign_no',
    duration: 1500,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.25,
        bones: {
          head: {rotation: -15},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.5,
        bones: {
          head: {rotation: 15},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.75,
        bones: {
          head: {rotation: -10},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 1,
        bones: {
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'normal',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  sign_please: {
    name: 'sign_please',
    duration: 2000,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: -45},
          rightHand: {rotation: 0},
          torso: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.5,
        bones: {
          rightUpperArm: {rotation: -10},
          rightLowerArm: {rotation: -60},
          rightHand: {rotation: -15},
          torso: {rotation: 5},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 1,
        bones: {
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: -45},
          rightHand: {rotation: 0},
          torso: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  sign_thankyou: {
    name: 'sign_thankyou',
    duration: 2500,
    loop: false,
    easing: 'ease-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightUpperArm: {rotation: -30},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
          head: {rotation: 5},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 0.5,
        bones: {
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: -60},
          rightHand: {rotation: 10},
          head: {rotation: 3},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'raised',
        },
      },
      {
        time: 1,
        bones: {
          rightUpperArm: {rotation: 0},
          rightLowerArm: {rotation: -30},
          rightHand: {rotation: 0},
          head: {rotation: 0},
        },
        emotions: {
          eyeExpression: 'happy',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  sign_help: {
    name: 'sign_help',
    duration: 2000,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          leftUpperArm: {rotation: 15},
          leftLowerArm: {rotation: -90},
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: -45},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 0.5,
        bones: {
          leftUpperArm: {rotation: 20},
          leftLowerArm: {rotation: -100},
          rightUpperArm: {rotation: -20},
          rightLowerArm: {rotation: -60},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'neutral',
          eyebrowExpression: 'normal',
        },
      },
      {
        time: 1,
        bones: {
          leftUpperArm: {rotation: 15},
          leftLowerArm: {rotation: -90},
          rightUpperArm: {rotation: -15},
          rightLowerArm: {rotation: -45},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },

  sign_listen: {
    name: 'sign_listen',
    duration: 2000,
    loop: false,
    easing: 'ease-in-out',
    keyframes: [
      {
        time: 0,
        bones: {
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
          head: {rotation: -10},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'neutral',
          eyebrowExpression: 'focused',
        },
      },
      {
        time: 0.5,
        bones: {
          rightUpperArm: {rotation: -50},
          rightLowerArm: {rotation: -100},
          rightHand: {rotation: -5},
          head: {rotation: -15},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'neutral',
          eyebrowExpression: 'focused',
        },
      },
      {
        time: 1,
        bones: {
          rightUpperArm: {rotation: -45},
          rightLowerArm: {rotation: -90},
          rightHand: {rotation: 0},
          head: {rotation: -10},
        },
        emotions: {
          eyeExpression: 'focused',
          mouthExpression: 'smile',
          eyebrowExpression: 'normal',
        },
      },
    ],
  },
};

// Animation utility functions
export const createCustomAnimation = (
  name: string,
  keyframes: AnimationKeyframe[],
  duration: number = 2000,
  loop: boolean = false,
  easing: AnimationSequence['easing'] = 'ease-in-out',
): AnimationSequence => ({
  name,
  keyframes,
  duration,
  loop,
  easing,
});

export const interpolateKeyframes = (
  keyframe1: AnimationKeyframe,
  keyframe2: AnimationKeyframe,
  t: number, // 0-1
): AnimationKeyframe => {
  // Linear interpolation between keyframes
  // This would be used by the animation engine
  return {
    time: keyframe1.time + (keyframe2.time - keyframe1.time) * t,
    bones: {}, // Would interpolate all bone transforms
    emotions: keyframe1.emotions, // For now, snap to keyframe1 emotions
  };
};

// AR/VR preparation - 3D transformation structure
export interface Avatar3DTransform {
  position: {x: number; y: number; z: number};
  rotation: {x: number; y: number; z: number};
  scale: {x: number; y: number; z: number};
}

export interface Future3DAvatar extends AnimatedAvatarProps {
  transform3D?: Avatar3DTransform;
  environmentLighting?: 'auto' | 'manual';
  shadowCasting?: boolean;
  physicsEnabled?: boolean;
}
