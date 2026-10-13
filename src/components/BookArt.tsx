import { useId } from "react";

export default function BookArt({ compact = false }: { compact?: boolean }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`book-art ${compact ? "compact" : ""}`}
      viewBox="0 0 560 440"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Авторская иллюстрация: маленький путешественник среди звёзд и песчаных дюн"
    >
      <defs>
        <linearGradient id={`${id}sky`} x2=".8" y2="1">
          <stop stopColor="#dad8f0" />
          <stop offset=".65" stopColor="#f3dcd6" />
          <stop offset="1" stopColor="#f6e6d3" />
        </linearGradient>
        <linearGradient id={`${id}dune`} x2="1" y2=".6">
          <stop stopColor="#e8d0c3" />
          <stop offset="1" stopColor="#fcf0de" />
        </linearGradient>
        <radialGradient id={`${id}moon`}>
          <stop stopColor="#fffcef" />
          <stop offset="1" stopColor="#fff6e3" />
        </radialGradient>
        <filter id={`${id}glow`}>
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <rect width="560" height="440" fill={`url(#${id}sky)`} />
      <circle
        cx="375"
        cy="129"
        r="72"
        fill="#fff1d9"
        opacity=".25"
        filter={`url(#${id}glow)`}
      />
      <circle cx="375" cy="129" r="46" fill={`url(#${id}moon)`} />
      <g fill="#fffdf6" opacity=".85">
        <circle cx="66" cy="96" r="2" />
        <circle cx="128" cy="43" r="2" />
        <circle cx="258" cy="104" r="2" />
        <circle cx="480" cy="72" r="2" />
        <circle cx="441" cy="214" r="1.6" />
        <circle cx="93" cy="218" r="1.5" />
        <circle cx="217" cy="188" r="1.5" />
        <path d="m186 86 3 9 9 3-9 3-3 9-3-9-9-3 9-3zM456 142l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
      </g>
      <ellipse
        cx="116"
        cy="145"
        rx="25"
        ry="8"
        transform="rotate(-24 116 145)"
        fill="none"
        stroke="#f9f4ec"
        strokeWidth="1.5"
        opacity=".7"
      />
      <circle cx="116" cy="145" r="13" fill="#b8b2d0" />
      <path d="M0 310Q111 204 283 306T560 278V440H0Z" fill="#d6c4c8" />
      <path
        d="M0 347Q148 246 340 334T560 316V440H0Z"
        fill={`url(#${id}dune)`}
      />
      <path d="M0 410Q146 315 349 390T560 361V440H0Z" fill="#f9ebd9" />
      <path
        d="M236 402q65-6 107 3"
        fill="none"
        stroke="#cbb9aa"
        strokeWidth="2"
        opacity=".4"
      />
      <g transform="translate(280 256)">
        <ellipse cx="16" cy="149" rx="30" ry="4" fill="#b99d89" opacity=".2" />
        <path d="m6 103 2 42 8 1 6-43M23 103l9 43 8-1-6-44" fill="#596358" />
        <path d="M1 48q16-14 31 0l12 55q-20 9-48 0z" fill="#738275" />
        <path d="m1 50-11 40 6 3 14-37M32 52l14 31-6 4-18-30" fill="#738275" />
        <path d="m-4 93 5 2-1 8-5-1M40 87l5-3 4 8-5 2" fill="#e1b698" />
        <rect x="11" y="32" width="11" height="15" rx="4" fill="#e6bda0" />
        <ellipse cx="17" cy="24" rx="16" ry="20" fill="#e6bda0" />
        <path
          d="M0 22 2 9 10 7 7 0l11 4 6-7 3 10 10 2-5 17-5-11-12 2-6-4z"
          fill="#d4aa65"
        />
        <path d="M2 43q15 9 31 1l-1 8q-16 5-31-1" fill="#edc45e" />
        <path d="M30 47q26 5 48-10l-4 14q-21 14-42 4" fill="#edc45e" />
      </g>
      <g transform="translate(407 347)">
        <path
          d="M12 37V12m0 16 8-8"
          stroke="#7a9479"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M11 22Q0 13 3 11q12 0 8 11M17 21q7-9 13-7-1 7-13 7"
          fill="#7a9479"
        />
        <path d="M5 9Q-2 0 7-4q7-8 13 0 9 4 2 11-9 7-17 2" fill="#bb777e" />
        <path
          d="M2 37V6q0-25 23-25T48 6v31z"
          transform="translate(-7 0)"
          fill="#fff"
          fillOpacity=".1"
          stroke="#fdf8ed"
          strokeWidth="1.5"
        />
        <path
          d="M-8 39h49"
          stroke="#a18b77"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g stroke="#a68e7b" strokeWidth="1.5" opacity=".35">
        <path d="m122 390 6-8m-26 16 5-8m20 15 6-7" />
      </g>
    </svg>
  );
}
