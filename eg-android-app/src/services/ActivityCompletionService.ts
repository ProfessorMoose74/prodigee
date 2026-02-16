import {EventEmitter} from 'events';

export interface ActivityCompletionData {
  activityType: string;
  score: number;
  starsEarned: number;
  accuracy: number;
  completed: boolean;
  newAchievements?: string[];
}

export interface AvatarAnimationEvent {
  trigger: string;
  animation: 'celebrating' | 'cheering' | 'jumping' | 'clapping' | 'waving';
  duration?: number;
}

class ActivityCompletionService extends EventEmitter {
  private completionQueue: ActivityCompletionData[] = [];

  // Handle activity completion and determine appropriate avatar animation
  handleActivityCompletion(
    completionData: ActivityCompletionData,
  ): AvatarAnimationEvent | null {
    this.completionQueue.push(completionData);

    const animationEvent = this.determineAvatarAnimation(completionData);

    if (animationEvent) {
      this.emit('avatarAnimation', animationEvent);
    }

    this.emit('activityCompleted', completionData);

    return animationEvent;
  }

  private determineAvatarAnimation(
    data: ActivityCompletionData,
  ): AvatarAnimationEvent | null {
    const {starsEarned, accuracy, completed, newAchievements} = data;

    // Exceptional performance - celebrating animation
    if (completed && accuracy >= 95 && starsEarned >= 3) {
      return {
        trigger: 'exceptional_performance',
        animation: 'celebrating',
        duration: 3000,
      };
    }

    // New achievement unlocked - cheering animation
    if (newAchievements && newAchievements.length > 0) {
      return {
        trigger: 'new_achievement',
        animation: 'cheering',
        duration: 2500,
      };
    }

    // High score (80%+ accuracy) - jumping animation
    if (completed && accuracy >= 80) {
      return {
        trigger: 'high_score',
        animation: 'jumping',
        duration: 1200,
      };
    }

    // Good completion (60%+ accuracy) - clapping animation
    if (completed && accuracy >= 60) {
      return {
        trigger: 'good_completion',
        animation: 'clapping',
        duration: 1500,
      };
    }

    // Activity completed but lower score - encouraging wave
    if (completed) {
      return {
        trigger: 'activity_completed',
        animation: 'waving',
        duration: 2000,
      };
    }

    return null;
  }

  // Get recent completions for dashboard display
  getRecentCompletions(limit: number = 5): ActivityCompletionData[] {
    return this.completionQueue.slice(-limit);
  }

  // Calculate completion stats
  getCompletionStats(): {
    totalActivities: number;
    averageAccuracy: number;
    totalStars: number;
    highScoreCount: number;
  } {
    const completions = this.completionQueue.filter(c => c.completed);

    if (completions.length === 0) {
      return {
        totalActivities: 0,
        averageAccuracy: 0,
        totalStars: 0,
        highScoreCount: 0,
      };
    }

    const totalAccuracy = completions.reduce((sum, c) => sum + c.accuracy, 0);
    const totalStars = completions.reduce((sum, c) => sum + c.starsEarned, 0);
    const highScoreCount = completions.filter(c => c.accuracy >= 80).length;

    return {
      totalActivities: completions.length,
      averageAccuracy: totalAccuracy / completions.length,
      totalStars,
      highScoreCount,
    };
  }

  // Trigger specific animation manually (for special events)
  triggerAvatarAnimation(
    animation: AvatarAnimationEvent['animation'],
    trigger: string = 'manual',
  ): void {
    const animationEvent: AvatarAnimationEvent = {
      trigger,
      animation,
      duration: this.getDefaultAnimationDuration(animation),
    };

    this.emit('avatarAnimation', animationEvent);
  }

  private getDefaultAnimationDuration(
    animation: AvatarAnimationEvent['animation'],
  ): number {
    const durations = {
      celebrating: 3000,
      cheering: 2500,
      jumping: 1200,
      clapping: 1500,
      waving: 2000,
    };
    return durations[animation];
  }

  // Special events that can trigger animations
  onStreakAchieved(streakDays: number): void {
    if (streakDays >= 7) {
      this.triggerAvatarAnimation('celebrating', 'week_streak');
    } else if (streakDays >= 3) {
      this.triggerAvatarAnimation('cheering', 'streak_milestone');
    }
  }

  onLevelUp(_newLevel: number): void {
    this.triggerAvatarAnimation('celebrating', 'level_up');
  }

  onStarMilestone(totalStars: number): void {
    const milestones = [10, 25, 50, 100, 200, 500];
    if (milestones.includes(totalStars)) {
      this.triggerAvatarAnimation('celebrating', 'star_milestone');
    }
  }

  onDailyGoalComplete(): void {
    this.triggerAvatarAnimation('cheering', 'daily_goal');
  }

  onPerfectScore(): void {
    this.triggerAvatarAnimation('celebrating', 'perfect_score');
  }

  // Reset completion history (for testing or new user)
  clearHistory(): void {
    this.completionQueue = [];
    this.emit('historyCleared');
  }
}

export const activityCompletionService = new ActivityCompletionService();
