/**
 * Manages the data state of the editor, including campaign levels and persistence.
 */
export class EditorState {
    constructor(ui) {
        this.ui = ui;
        this.campaign = [this._createEmptyLevel(1)];
        this.currentIndex = 0;
        this._load();
    }

    get level() { return this.campaign[this.currentIndex]; }
    set level(val) { this.campaign[this.currentIndex] = val; }

    _createEmptyLevel(num) {
        return {
            id: `custom-${num-1}`,
            name: `CUSTOM SECTOR ${num}`,
            packageStart: { fx: 0.1, fy: 0.5 },
            destination: { fx: 0.8, fy: 0.5, fw: 0.1, fh: 0.1 },
            time: 60,
            obstacles: [],
            collectibles: []
        };
    }

    save() {
        localStorage.setItem('gravity-courier-custom-campaign', JSON.stringify(this.campaign));
        if (this.ui) this.ui.showToast('CAMPAIGN ENCRYPTED AND SAVED.');
    }

    _load() {
        const saved = localStorage.getItem('gravity-courier-custom-campaign');
        if (saved) {
            try {
                this.campaign = JSON.parse(saved);
                this.currentIndex = 0;
            } catch (e) { console.error('Failed to load campaign:', e); }
        }
    }

    nextLevel() {
        if (this.currentIndex < this.campaign.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    prevLevel() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    addLevel() {
        this.campaign.push(this._createEmptyLevel(this.campaign.length + 1));
        this.currentIndex = this.campaign.length - 1;
    }

    deleteCurrentLevel() {
        if (this.campaign.length > 1) {
            this.campaign.splice(this.currentIndex, 1);
            this.currentIndex = Math.max(0, this.currentIndex - 1);
            return true;
        }
        return false;
    }

    refreshIndices() {
        this.campaign.forEach((lvl, i) => {
            lvl.id = `custom-${i}`;
        });
    }
}
