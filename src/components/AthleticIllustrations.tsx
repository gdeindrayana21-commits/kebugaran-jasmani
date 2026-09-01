import React from 'react';
import { FitnessTestType } from '../types';

interface IllustrationProps {
  type: FitnessTestType;
  className?: string;
}

export const AthleticIllustration: React.FC<IllustrationProps> = ({ type, className = 'w-full h-full' }) => {
  switch (type) {
    case 'push_up':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_pu" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="glow_pu" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Floor grid line */}
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="20" y1="105" x2="180" y2="105" stroke="#10B981" strokeWidth="2" opacity="0.4" />
          
          {/* Athlete body in push up posture */}
          {/* Head */}
          <circle cx="150" cy="55" r="10" fill="url(#grad_pu)" filter="url(#glow_pu)" />
          {/* Torso & Legs line */}
          <path d="M 45 98 L 95 72 L 140 60" stroke="url(#grad_pu)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms */}
          <path d="M 135 62 L 140 85 L 145 105" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Feet */}
          <circle cx="45" cy="98" r="4" fill="#38BDF8" />
          {/* Motion energy waves */}
          <path d="M 130 40 Q 140 32 150 40" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 125 32 Q 140 22 155 32" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          {/* Muscle highlight badge */}
          <circle cx="115" cy="65" r="3" fill="#F59E0B" />
        </svg>
      );

    case 'sit_up':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_su" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow_su" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          {/* Mat */}
          <rect x="25" y="102" width="150" height="5" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          
          {/* Athlete head */}
          <circle cx="95" cy="40" r="10" fill="url(#grad_su)" filter="url(#glow_su)" />
          {/* Torso crunching up */}
          <path d="M 100 48 L 105 75 L 75 98" stroke="url(#grad_su)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Bent knees and feet */}
          <path d="M 75 98 L 125 75 L 140 98" stroke="#60A5FA" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms bent behind head */}
          <path d="M 100 52 L 88 45 L 94 38" stroke="#A78BFA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Abdominal core energy arc */}
          <path d="M 90 70 A 15 15 0 0 1 115 70" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
          {/* Directional arrow arc */}
          <path d="M 60 70 Q 75 40 90 35" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'back_up':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_bu" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="glow_bu" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <rect x="25" y="102" width="150" height="5" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          
          {/* Athlete head raised */}
          <circle cx="150" cy="45" r="10" fill="url(#grad_bu)" filter="url(#glow_bu)" />
          {/* Back hyperextension curve */}
          <path d="M 40 98 L 85 96 Q 115 90 142 52" stroke="url(#grad_bu)" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Hands behind head/neck */}
          <path d="M 142 55 L 132 45 L 140 38" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          {/* Back muscle focus glow */}
          <circle cx="110" cy="80" r="4" fill="#EF4444" opacity="0.9" />
          {/* Upward motion glow arcs */}
          <path d="M 160 55 Q 168 45 162 35" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 168 60 Q 176 48 170 38" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case 'jongkok_bangun':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_sq" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="glow_sq" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Squat stance athlete */}
          <circle cx="100" cy="35" r="9" fill="url(#grad_sq)" filter="url(#glow_sq)" />
          {/* Torso & hips */}
          <path d="M 100 44 L 98 68 L 78 80" stroke="url(#grad_sq)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Deep bent legs */}
          <path d="M 78 80 L 110 82 L 105 102" stroke="#38BDF8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Forward balancing arms */}
          <path d="M 98 52 L 128 52" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" />
          {/* Up-Down cycle arrow indicator */}
          <path d="M 145 45 L 145 85 M 140 52 L 145 45 L 150 52 M 140 78 L 145 85 L 150 78" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Quadricep focus dot */}
          <circle cx="95" cy="80" r="3" fill="#14B8A6" />
        </svg>
      );

    case 'lari_bolak_balik':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_sr" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow_sr" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          {/* Pylons / cones at both ends */}
          <polygon points="25,105 32,85 39,105" fill="#F97316" stroke="#FB923C" strokeWidth="1" />
          <polygon points="165,105 172,85 179,105" fill="#F97316" stroke="#FB923C" strokeWidth="1" />
          
          {/* Dynamic sprint sprinter */}
          <circle cx="115" cy="38" r="9" fill="url(#grad_sr)" filter="url(#glow_sr)" />
          {/* Angled sprint torso */}
          <path d="M 115 47 L 98 70" stroke="url(#grad_sr)" strokeWidth="7" strokeLinecap="round" />
          {/* Front driving leg */}
          <path d="M 98 70 L 122 78 L 128 102" stroke="#F43F5E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Trailing leg */}
          <path d="M 98 70 L 72 82 L 65 92" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Pumping arms */}
          <path d="M 108 55 L 125 58 L 132 48" stroke="#E879F9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 105 55 L 88 64 L 82 75" stroke="#E879F9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Speed shuttle lines */}
          <path d="M 45 92 L 155 92" stroke="#EC4899" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
          <path d="M 155 96 L 45 96" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
        </svg>
      );

    case 'naik_turun_tangga':
      return (
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="grad_st" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="glow_st" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          {/* Stepper bench / stairs */}
          <path d="M 90 105 L 90 85 L 135 85 L 135 105 Z" fill="#1E293B" stroke="#06B6D4" strokeWidth="2" />
          <path d="M 135 105 L 135 65 L 175 65 L 175 105 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          
          {/* Step test athlete stepping up */}
          <circle cx="78" cy="30" r="9" fill="url(#grad_st)" filter="url(#glow_st)" />
          {/* Torso */}
          <path d="M 78 39 L 82 68" stroke="url(#grad_st)" strokeWidth="7" strokeLinecap="round" />
          {/* Stepping leg up onto bench */}
          <path d="M 82 68 L 102 68 L 105 84" stroke="#22D3EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Support leg on ground */}
          <path d="M 82 68 L 70 85 L 68 104" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Running arms in sync */}
          <path d="M 80 48 L 95 54 L 92 65" stroke="#67E8F9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Step cadence rhythm arcs */}
          <path d="M 112 65 Q 120 58 116 50" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 118 70 Q 128 60 122 50" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    default:
      return null;
  }
};
