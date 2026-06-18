<template>
  <svg class="empty-robot" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bodyG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <linearGradient id="headG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e0e7ff" />
        <stop offset="100%" stop-color="#a5b4fc" />
      </linearGradient>
      <radialGradient id="coffeeG" cx="0.5" cy="0.3" r="0.7">
        <stop offset="0%" stop-color="#fcd34d" />
        <stop offset="60%" stop-color="#92400e" />
        <stop offset="100%" stop-color="#451a03" />
      </radialGradient>
    </defs>

    <!-- Shadow -->
    <ellipse cx="120" cy="220" rx="70" ry="8" fill="#0f172a" opacity="0.5" />

    <!-- Antennas -->
    <line x1="120" y1="45" x2="120" y2="20" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round" />
    <circle cx="120" cy="18" r="6" fill="#f59e0b">
      <animate attributeName="r" values="5;7;5" dur="1.4s" repeatCount="indefinite" />
    </circle>

    <!-- Head -->
    <rect x="70" y="45" width="100" height="80" rx="22" fill="url(#headG)" stroke="#4338ca" stroke-width="3" />

    <!-- Sunglasses -->
    <rect x="78" y="72" width="38" height="24" rx="6" fill="#0f172a" stroke="#1e293b" stroke-width="2" />
    <rect x="124" y="72" width="38" height="24" rx="6" fill="#0f172a" stroke="#1e293b" stroke-width="2" />
    <line x1="116" y1="84" x2="124" y2="84" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
    <!-- Shine -->
    <rect x="84" y="76" width="10" height="4" rx="2" fill="#fff" opacity="0.7" />
    <rect x="130" y="76" width="10" height="4" rx="2" fill="#fff" opacity="0.7" />

    <!-- Smile -->
    <path d="M100 105 Q120 118 140 105" stroke="#4338ca" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- Neck -->
    <rect x="110" y="122" width="20" height="10" fill="#6366f1" />

    <!-- Body -->
    <rect x="55" y="132" width="130" height="80" rx="20" fill="url(#bodyG)" stroke="#4338ca" stroke-width="3" />
    <circle cx="85" cy="160" r="5" fill="#fde68a" />
    <circle cx="120" cy="160" r="5" fill="#fca5a5" />
    <circle cx="155" cy="160" r="5" fill="#86efac" />

    <!-- Chest Panel -->
    <rect x="88" y="175" width="64" height="26" rx="8" fill="#e0e7ff" stroke="#4338ca" stroke-width="2" />
    <circle cx="100" cy="188" r="3" fill="#10b981" />
    <rect x="108" y="185" width="36" height="6" rx="2" fill="#0f172a" />
    <rect x="110" y="187" width="22" height="2" fill="#6ee7b7">
      <animate attributeName="width" values="10;30;10" dur="1.8s" repeatCount="indefinite" />
    </rect>

    <!-- Arms -->
    <rect x="30" y="150" width="26" height="50" rx="12" fill="url(#bodyG)" stroke="#4338ca" stroke-width="3" />
    <rect x="184" y="150" width="26" height="50" rx="12" fill="url(#bodyG)" stroke="#4338ca" stroke-width="3" />

    <!-- Coffee cup (in right arm) -->
    <g transform="translate(195 195)">
      <path d="M0 -5 L22 -5 L20 22 Q11 28 2 22 Z" fill="#f8fafc" stroke="#4338ca" stroke-width="2" />
      <ellipse cx="11" cy="-3" rx="11" ry="3" fill="url(#coffeeG)" />
      <ellipse cx="11" cy="-4" rx="9" ry="2" fill="#78350f" opacity="0.6" />
      <!-- Handle -->
      <path d="M22 2 Q30 6 22 12" fill="none" stroke="#4338ca" stroke-width="2" />
      <!-- Steam -->
      <path d="M6 -14 Q8 -20 4 -26" stroke="#e2e8f0" stroke-width="2" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M14 -14 Q18 -22 12 -30" stroke="#e2e8f0" stroke-width="2" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0;1" dur="2.2s" repeatCount="indefinite" />
      </path>
    </g>

    <!-- Feet -->
    <rect x="80" y="212" width="28" height="12" rx="4" fill="#4338ca" />
    <rect x="132" y="212" width="28" height="12" rx="4" fill="#4338ca" />
  </svg>
</template>
