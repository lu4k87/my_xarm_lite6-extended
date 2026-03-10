window.onload = function() {

    const server_ip = window.location.hostname; 
    const final_ip = server_ip ? server_ip : 'localhost';
    const rosbridge_url = 'ws://' + final_ip + ':9090';
    
    var ros = new ROSLIB.Ros({ url : rosbridge_url });
    const statusValueElement = document.getElementById('status-value-text');

    ros.on('connection', () => {
        statusValueElement.textContent = 'Online';
        statusValueElement.className = 'status-value status-online';
    });

    ros.on('error', () => {
        statusValueElement.textContent = 'Fehler'; 
        statusValueElement.className = 'status-value status-error';
    });

    ros.on('close', () => {
        statusValueElement.textContent = 'Offline';
        statusValueElement.className = 'status-value status-offline';
    });

    const iconA = document.getElementById('icon-a');
    const iconX = document.getElementById('icon-x');
    const iconY = document.getElementById('icon-y');
    const eefPosElement = document.getElementById('eef-pos');
    const speedValTextElement = document.querySelector('.speed-val-text');
    const speedBarFillElement = document.getElementById('speed-bar-fill');
    const joyLogContentElement = document.getElementById('joy-log-content');
    const voiceFeedbackElement = document.getElementById('voice-feedback-content');
    const frameDisplay = document.getElementById('frame-display');

    let isGripperActive = false;
    let previousYState = 0, previousAState = 0, previousXState = 0;
    const MAX_LOG_LINES = 20;

    // --- NEUE FUNKTION FÜR STRUKTURIERTES FEEDBACK ---
    function updateSpeechStatus(rawCommand) {
        const cmd = rawCommand.toLowerCase();
        let colorData = { name: "Unbekannt", emoji: "❓", cssClass: "" };

        // Erkennung der Farben Rot, Grün, Blau
        if (cmd.includes("red") || cmd.includes("rot")) {
            colorData = { name: "Rot", emoji: "🔴", cssClass: "color-red" };
        } else if (cmd.includes("green") || cmd.includes("grün")) {
            colorData = { name: "Grün", emoji: "🟢", cssClass: "color-green" };
        } else if (cmd.includes("blue") || cmd.includes("blau")) {
            colorData = { name: "Blau", emoji: "🔵", cssClass: "color-blue" };
        }

        voiceFeedbackElement.innerHTML = `
            <div class="status-line"><span class="label">[EINGABE]</span> <span class="value">"${rawCommand}"</span></div>
            <div class="status-line"><span class="label">[STATUS]</span> <span class="value">Verarbeitet <span class="success-check">✅</span></span></div>
            <div class="status-line"><span class="label">[AKTION]</span> <span class="value">Fahre zu: <span class="${colorData.cssClass}">${colorData.name}</span> ${colorData.emoji}</span></div>
        `;
    }

    function handleYActivation() {
        iconY.classList.add('active');
        setTimeout(() => iconY.classList.remove('active'), 3000);
    }
    
    function handleXActivation() {
        iconX.classList.toggle('active');
    }
    
    function handleAActivation() {
        isGripperActive = !isGripperActive;
        iconA.classList.toggle('active', isGripperActive);
    }

    var joyListener = new ROSLIB.Topic({ ros: ros, name: '/joy', messageType: 'sensor_msgs/Joy' });
    joyListener.subscribe((message) => {
        if (message.buttons[3] === 1 && previousYState === 0) handleYActivation();
        if (message.buttons[0] === 1 && previousAState === 0) handleAActivation();
        if (message.buttons[2] === 1 && previousXState === 0) handleXActivation();
        previousYState = message.buttons[3];
        previousAState = message.buttons[0];
        previousXState = message.buttons[2];
    });

    var posListener = new ROSLIB.Topic({ ros: ros, name: '/ui/eef_position', messageType: 'std_msgs/Float32MultiArray' });
    posListener.subscribe((message) => {
        eefPosElement.innerHTML = `
            <span class="x-axis-group axis-group"><span class="x-axis">X:</span> <span class="x-val">${message.data[0].toFixed(0)}</span> mm</span>
            <span class="y-axis-group axis-group"><span class="y-axis">Y:</span> <span class="y-val">${message.data[1].toFixed(0)}</span> mm</span>
            <span class="z-axis-group axis-group"><span class="z-axis">Z:</span> <span class="z-val">${message.data[2].toFixed(0)}</span> mm</span>`;
    });

    var speedListener = new ROSLIB.Topic({ ros: ros, name: '/ui/robot_control/current_speed', messageType: 'std_msgs/Float32' });
    speedListener.subscribe((message) => {
        let val = message.data;
        speedValTextElement.textContent = `${(val * 100).toFixed(0)}%`;
        let fillWidth = Math.ceil(val * 5) * 20;
        speedBarFillElement.style.width = `${fillWidth}%`;
        speedBarFillElement.classList.toggle('speed-bar-full', fillWidth >= 100);
    });

    var joyLogListener = new ROSLIB.Topic({ ros: ros, name: '/ui/joy_button_presses', messageType: 'std_msgs/String' });
    joyLogListener.subscribe((message) => {
        const msg = message.data;
        if (msg.includes("link_eef")) {
            frameDisplay.textContent = "TOOL (link_eef)";
            frameDisplay.className = "frame-val-text frame-eef";
        } else if (msg.includes("link_base")) {
            frameDisplay.textContent = "BASE (link_base)";
            frameDisplay.className = "frame-val-text frame-base";
        }

        const logLine = document.createElement('div');
        logLine.textContent = msg;
        joyLogContentElement.appendChild(logLine);
        joyLogContentElement.scrollTop = joyLogContentElement.scrollHeight;
        if (joyLogContentElement.childElementCount > MAX_LOG_LINES) joyLogContentElement.removeChild(joyLogContentElement.firstChild);
    });

    // --- AKTUALISIERTER VOICE FEEDBACK LISTENER ---
    var voiceFeedbackListener = new ROSLIB.Topic({ ros: ros, name: '/ui/voice_feedback', messageType: 'std_msgs/String' });
    voiceFeedbackListener.subscribe((message) => { 
        updateSpeechStatus(message.data); 
    });

    var collisionListener = new ROSLIB.Topic({ ros: ros, name: '/ui/collision_msg', messageType: 'std_msgs/String' });
    collisionListener.subscribe((message) => {
        const logLine = document.createElement('div');
        logLine.textContent = message.data;
        logLine.classList.add(message.data.includes('Kollision') ? 'collision-active-log' : 'collision-cleared-log');
        joyLogContentElement.appendChild(logLine);
        joyLogContentElement.scrollTop = joyLogContentElement.scrollHeight;
    });
};
