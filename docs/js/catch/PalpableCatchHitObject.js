function PalpableCatchHitObject(data, beatmap) {
    this.beatmap = beatmap;
    this.type = data.type;
    this.time = data.time;
    this.x = data.x;
    this.radius = data.radius;
    this.hyperDash = false;
    this.edge = false;
    this.XDistToNext = [1, 1, 1];
    this.hitSound = data.hitSound || "0";
}
