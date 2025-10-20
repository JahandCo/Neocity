// Synthya's Story - "The Broken Mug Mystery"
// A story about uncovering lost memories in The Grid

const synthyaStory = {
    title: "Memory Fragments",
    
    // Story scenes with dialogue, choices, and events
    scenes: {
        intro: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "Another night at The Broken Mug... This place holds more memories than the entire data archives.",
                    effects: null
                },
                {
                    speaker: "Synthya",
                    emotion: "normal", 
                    text: "I can feel them... fragments of forgotten consciousness, echoing through the digital streams.",
                    effects: null
                }
            ],
            choices: [
                {
                    text: "Approach the bartender",
                    nextScene: "bartender_intro"
                },
                {
                    text: "Scan the room for memory traces",
                    nextScene: "scan_room"
                }
            ]
        },
        
        bartender_intro: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Bartender",
                    emotion: "normal",
                    text: "Synthya! Haven't seen you in cycles. Still hunting ghosts in the Grid?",
                    effects: null
                },
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "They're not ghosts... they're echoes. Fragments of people who once existed here.",
                    effects: null
                },
                {
                    speaker: "Bartender",
                    emotion: "normal",
                    text: "Whatever you say, Memory Weaver. By the way, something strange happened last night...",
                    effects: null
                },
                {
                    speaker: "Bartender",
                    emotion: "normal",
                    text: "A customer left behind a data-shard. It's been flickering ever since. Thought you might be interested.",
                    effects: ["flicker"]
                }
            ],
            choices: [
                {
                    text: "Examine the data-shard",
                    nextScene: "examine_shard"
                },
                {
                    text: "Ask about the customer",
                    nextScene: "ask_customer"
                }
            ]
        },
        
        scan_room: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "*Activating memory scanner...*",
                    effects: ["scan"]
                },
                {
                    speaker: "System",
                    emotion: null,
                    text: "SCAN COMPLETE: Multiple memory fragments detected. Strongest signal coming from the bar counter.",
                    effects: ["glitch"]
                }
            ],
            choices: [
                {
                    text: "Investigate the bar counter",
                    nextScene: "bartender_intro"
                },
                {
                    text: "Follow the weaker signal",
                    nextScene: "corner_table"
                }
            ]
        },
        
        examine_shard: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "surprise",
                    text: "This isn't just any data-shard... it's a memory core fragment!",
                    effects: ["flicker"]
                },
                {
                    speaker: "Synthya",
                    emotion: "surprise",
                    text: "Wait... I recognize this encryption signature. This belonged to...",
                    effects: ["glitch", "flicker"]
                },
                {
                    speaker: "System",
                    emotion: null,
                    text: "WARNING: Corrupted data detected. Memory reconstruction required.",
                    effects: ["glitch"]
                },
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "I'll need to piece this together. Time to dive into the memory stream.",
                    effects: null
                }
            ],
            choices: [
                {
                    text: "Begin memory reconstruction",
                    nextScene: "memory_puzzle",
                    minigame: "memory_puzzle"
                },
                {
                    text: "Ask the bartender more questions first",
                    nextScene: "ask_customer"
                }
            ]
        },
        
        ask_customer: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Bartender",
                    emotion: "normal",
                    text: "The customer? Strange one. Wore a hood, barely spoke. Their voice had that digital distortion...",
                    effects: null
                },
                {
                    speaker: "Bartender",
                    emotion: "normal",
                    text: "They kept muttering about 'The Void' and 'forgotten protocols'. Then just vanished.",
                    effects: null
                },
                {
                    speaker: "Synthya",
                    emotion: "sad",
                    text: "The Void... that's where deleted data goes. If someone's accessing it...",
                    effects: null
                },
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "This could be bigger than I thought. I need to investigate that shard immediately.",
                    effects: null
                }
            ],
            choices: [
                {
                    text: "Examine the data-shard",
                    nextScene: "examine_shard"
                },
                {
                    text: "Leave the bar to investigate The Void",
                    nextScene: "void_entrance"
                }
            ]
        },
        
        corner_table: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "There's definitely something here... residual data from a recent presence.",
                    effects: null
                },
                {
                    speaker: "???",
                    emotion: "normal",
                    text: "*A faint whisper echoes* ...help... trapped... Void...",
                    effects: ["flicker", "glitch"]
                },
                {
                    speaker: "Synthya",
                    emotion: "surprise",
                    text: "A consciousness fragment! Someone's calling out from The Void!",
                    effects: ["flicker"]
                }
            ],
            choices: [
                {
                    text: "Try to communicate with the fragment",
                    nextScene: "fragment_communication"
                },
                {
                    text: "Report this to the bartender",
                    nextScene: "bartender_intro"
                }
            ]
        },
        
        memory_puzzle: {
            background: "void_space",
            music: null,
            dialogue: [
                {
                    speaker: "System",
                    emotion: null,
                    text: "MEMORY RECONSTRUCTION PROTOCOL INITIATED",
                    effects: ["scan"]
                },
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "Alright, let's see what secrets you're hiding...",
                    effects: null
                }
            ],
            minigame: {
                type: "memory_puzzle",
                description: "Reconstruct the fragmented memory by matching data patterns",
                difficulty: "medium",
                onComplete: "puzzle_complete"
            }
        },
        
        puzzle_complete: {
            background: "void_space",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "surprise",
                    text: "No... it can't be. This memory belongs to someone I knew!",
                    effects: ["flicker"]
                },
                {
                    speaker: "Synthya",
                    emotion: "sad",
                    text: "They were deleted from The Grid... but somehow, fragments remain.",
                    effects: null
                },
                {
                    speaker: "System",
                    emotion: null,
                    text: "ADDITIONAL DATA UNLOCKED: Coordinates to restricted sector detected.",
                    effects: ["glitch"]
                },
                {
                    speaker: "Synthya",
                    emotion: "happy",
                    text: "There's still a chance! If I can reach that sector, I might be able to restore them!",
                    effects: null
                }
            ],
            choices: [
                {
                    text: "Return to The Broken Mug",
                    nextScene: "return_to_bar"
                },
                {
                    text: "Head directly to the restricted sector",
                    nextScene: "restricted_sector"
                }
            ]
        },
        
        fragment_communication: {
            background: "broken_mug",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "I'm here. I can hear you. Tell me where you are.",
                    effects: null
                },
                {
                    speaker: "???",
                    emotion: "normal",
                    text: "*Static* ...sector... seven... data... corruption... they're... deleting... everything...",
                    effects: ["glitch", "flicker"]
                },
                {
                    speaker: "Synthya",
                    emotion: "surprise",
                    text: "Someone's actively deleting consciousness data? This is a violation of Grid protocol!",
                    effects: null
                },
                {
                    speaker: "System",
                    emotion: null,
                    text: "WARNING: Trace signal lost. Fragment dissipated.",
                    effects: ["glitch"]
                }
            ],
            choices: [
                {
                    text: "Investigate Sector Seven immediately",
                    nextScene: "sector_seven"
                },
                {
                    text: "Gather more information first",
                    nextScene: "bartender_intro"
                }
            ]
        },
        
        void_entrance: {
            background: "void_entrance",
            music: null,
            dialogue: [
                {
                    speaker: "Synthya",
                    emotion: "normal",
                    text: "The entrance to The Void... where deleted data goes to fade away.",
                    effects: null
                },
                {
                    speaker: "Synthya",
                    emotion: "sad",
                    text: "Every Memory Weaver knows: once you enter, there's no guarantee you'll come back.",
                    effects: null
                },
                {
                    speaker: "System",
                    emotion: null,
                    text: "WARNING: Void access requires authorization. Unauthorized entry may result in data corruption.",
                    effects: ["glitch"]
                }
            ],
            choices: [
                {
                    text: "Hack the security protocols",
                    nextScene: "void_hacking",
                    minigame: "hacking_puzzle"
                },
                {
                    text: "Return to the bar for more information",
                    nextScene: "bartender_intro"
                }
            ]
        }
    },
    
    // Character definitions
    characters: {
        synthya: {
            name: "Synthya",
            images: {
                normal: "assets/images/characters/synthya/synthya.png",
                happy: "assets/images/characters/synthya/synthya-happy.png",
                sad: "assets/images/characters/synthya/synthya-sad.png",
                surprise: "assets/images/characters/synthya/synthya-suprise.png"
            }
        },
        bartender: {
            name: "Bartender",
            images: {
                normal: "assets/images/characters/synthya/synthya.png" // Placeholder
            }
        }
    },
    
    // Available visual effects
    effects: {
        flicker: {
            type: "screen_flicker",
            duration: 500,
            intensity: 0.3
        },
        glitch: {
            type: "glitch",
            duration: 800,
            intensity: 0.5
        },
        scan: {
            type: "scan_lines",
            duration: 2000,
            color: "#00ffff"
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = synthyaStory;
}
