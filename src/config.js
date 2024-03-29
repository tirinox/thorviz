const IsProduction = process.env.NODE_ENV !== 'development'
console.log('Env = ', process.env.NODE_ENV)

// const Live = true

export const Config = {
    DataSource: {
        THORNodeURL: 'https://thornode.ninerealms.com',
        MidgardURL: 'https://midgard.ninerealms.com',

        Nodes: {
            PollPeriod: 3000.0, // msec
        },

        LastBlock: {
            PollPeriod: 10000.0, // msec
        },

        Network: {
            PollPeriod: 60 * 1000.0,
        },

        ReactRandomDelay: 500.0, // msec
        NodeJuggler: {
            // Enabled: !IsProduction
            Enabled: false
        }
    },
    Font: {
        // Main: 'fonts/NorseBold-2Kge.otf'
        Main: 'fonts/Exo2-VariableFont_wght.ttf'
    },
    Effects: {
        Bloom: {
            Enabled: true,
            Strength: 0.65,
            Threshold: 0.5,
            Radius: 1.2,
        }
    },
    Controls: {
        Camera: {
            Distance: {
                Min: 800,
                Max: 2900,
                Start: 2000,
            },
            AzimuthAngleLimit: 180,
            PolarAngleLimit: 180,
            MouseMoveStrength: 0.0002,

            Animation: {
                Duration: 500.0,
                DistanceWhenZoomed: 300.0,
                Shift: {
                    X: -200.0
                }
            }
        },
    },
    Scene: {
        DebugMode: false, // 'nodeobj',

        Background: {
            Enabled: IsProduction,
        },
        Sky: {
            SkyBox: 'texture/skybox/star',
            SkyBoxExt: 'png',
        },
        NodeObject: {
            Simple: false,
            PlaneScale: 1.0,
            MinRadius: 12.0,
            MaxScale: 80.0,
            MinScale: 10.0,
            ScaleFactor: 1.0,
            RadiusFactor: 0.3,
            Animation: {
                // todo use this configs!
                ReactStatus: {
                    DurationIn: 500, // ms
                    DurationOut: 1250,
                    BloatScale: 1.5,
                },
                ReactSlash: {
                    Force: 100.0,
                    RedDuration: 150.0, // ms
                }
            },
            Rust: {
                MaxLagToFullRust: 2 * 60 * 60 * 24, // sec,
                MaxStrength: 0.85,
            },

        },
        Globe: {
            Enabled: true,
            Details: 64,
            Radius: 600.0,
            NodeElevation: 20.0,
            TextureMap: 'texture/globe/2k_earth_nightmap.jpeg',
            // TextureMap: 'texture/globe/2k_earth_daymap.jpeg',
            Clouds: {
                ElevationScale: 1.005,
                Opacity: 0.05,
                Texture: 'texture/globe/earth_atmo.jpeg',
            },
            Atmosphere: {
                ElevationScale: 1.15,
            },
            InnerAtmosphere: {
                Enabled: true,
            }
        },
    },
    Physics: {
        BaseForce: 3500.0,
        RepelForce: 200.0, // 2000
        Startup: {
            SimulationSteps: 10,
            DeltaTime: 0.1
        },
        BaseFriction: 0.07, //0.04
        HoverFriction: 0.3, //0.04
        MaxSpeedSq: Math.pow(15000, 2),
        Attractor: {
            Flat: {
                DeltaZ: 1.0,
            }
        },

    },
    Debug: {
        ShowFPS: false,
    },
    Renderer: {
        LogZBuffer: true,
        // LogZBuffer: false,
    },
    SoftwareVersion: {
        Enabled: true,
        Interval: 60 * 1000, // ms
    }
}

export const Colors = {
    LightningBlue: 0x00CCFF,
    YggdrasilGreen: 0x33FF99,
    MidgardTurqoise: 0x23DCC8,
    NightBlack: 0x101921
}
