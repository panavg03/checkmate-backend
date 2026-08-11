export const levelFlags: Record<string, string[]> = {
    "Lobby": [],
    "Level1": [
        "TRANSLATE", //Board translated
        "LOCKER_OPEN", //Biglight locker open
        "BIGLIGHT",  //Biglight equipped for all
        "LARGE_DOOR" //Door enlarged
    ]
}

export const levelCoords: Record<string, number[]> = {
    "Level1": [0, 3, 18],
    "Level2": [0, 0, 0],
    "Level3": [16, 2, -61],
    "Level4": [0, 1, 0],
    "Lobby": [-3, 2, -16]
}

export const levelNames = ["Level1", "Level2", "Level3", "Level4"];