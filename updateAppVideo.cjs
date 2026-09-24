const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import ReactPlayer from 'react-player/youtube';")) {
  code = code.replace("import BackgroundAudio from './components/BackgroundAudio';", "import BackgroundAudio from './components/BackgroundAudio';\nimport ReactPlayer from 'react-player/youtube';");
}

const loginVideo = `
      {role === null && (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <ReactPlayer 
            url="https://www.youtube.com/watch?v=tP2jMESq-7A"
            playing={true}
            loop={true}
            muted={true}
            width="100vw"
            height="100vh"
            style={{ transform: 'scale(1.5)' }}
            config={{
              youtube: {
                playerVars: {
                  controls: 0,
                  disablekb: 1,
                  modestbranding: 1,
                  showinfo: 0,
                  rel: 0,
                  iv_load_policy: 3,
                  fs: 0
                }
              }
            }}
          />
        </div>
      )}
`;

if (!code.includes("https://www.youtube.com/watch?v=tP2jMESq-7A")) {
  code = code.replace("{/* Background Soft Overlay - Immersive Dark Forest Tint */}", loginVideo + "\n      {/* Background Soft Overlay - Immersive Dark Forest Tint */}");
}

fs.writeFileSync('src/App.tsx', code);
