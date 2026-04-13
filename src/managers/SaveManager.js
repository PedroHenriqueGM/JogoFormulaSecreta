export class SaveManager {
    static SAVE_KEY = 'formula_secreta_save';

    static save(data) {
        const saveData = {
            level: data.level,
            playerX: data.playerX,
            playerY: data.playerY,
            health: data.health,
            timestamp: Date.now()
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
        console.log('Jogo salvo!', saveData);
    }

    static load() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        return raw ? JSON.parse(raw) : null; // retorna null se não houver save
    }

    static hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }

}