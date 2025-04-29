// c# 将小数赋值给int，会直接向下取整
function Csharp_Number2Int(num) {
    let numSplit = num.toFixed(8).split(".");
    return parseInt(numSplit[0]);
}

// c# round当小数为0.5时取偶
function Csharp_Round(num) {
    num = parseFloat(num.toFixed(8));
    let numSplit = num.toFixed(8).split(".");
    let numInt = parseInt(numSplit[0]);
    let numDecimal = parseInt(numSplit[1]);
    if (numDecimal > 50000000) numInt += 1;
    else if (numDecimal == 50000000) {
        if (numInt % 2 == 1) numInt += 1;
    }
    return numInt;
}

function Number2Float(num) {
    let float32View = new DataView(new ArrayBuffer(4));
    float32View.setFloat32(0, num);
    return float32View.getFloat32(0);
}

function Catch(osu, mods) {
    Beatmap.call(this, osu, mods);

    this.circleRadius = this.circleDiameter / 2 - 4;
    this.smallRadius = this.circleRadius / 2;
    this.tinyRadius = this.smallRadius / 2;
    this.bananaRadius = this.circleRadius * 0.8;

    this.CATCHER_HEIGHT = Beatmap.HEIGHT / 8;
    this.FALLOUT_TIME = (this.CATCHER_HEIGHT / Beatmap.HEIGHT) * this.approachTime;

    var combo = 1,
        comboIndex = -1,
        setComboIndex = 1;
    for (var i = 0; i < this.HitObjects.length; i++) {
        let hitObject = this.HitObjects[i];
        if (hitObject instanceof BananaShower) {
            setComboIndex = 1;
        }
        else if (hitObject.newCombo || setComboIndex) {
            combo = 1;
            comboIndex = ((comboIndex + 1) + hitObject.comboSkip) % this.Colors.length;
            setComboIndex = 0;
        }
        hitObject.combo = combo++;
        hitObject.color = (this.colorChange) ? this.Colors[i % this.Colors.length] : this.Colors[comboIndex];

        if (hitObject instanceof JuiceStream || hitObject instanceof BananaShower) {
            hitObject.buildNested();
        }
    }

    this.CATCHER_BASE_SIZE = 106.75;
    this.ALLOWED_CATCH_RANGE = 0.8;
    this.HYPER_DASH_TRANSITION_DURATION = 180;
    this.calculateScale = 1.0 - 0.7 * (this.CircleSize - 5) / 5;
    this.catchWidth = this.CATCHER_BASE_SIZE * Math.abs(this.calculateScale) * this.ALLOWED_CATCH_RANGE;
    this.halfCatcherWidth = this.catchWidth / 2;
    this.halfCatcherWidth /= this.ALLOWED_CATCH_RANGE;
    this.BASE_DASH_SPEED = 1;
    this.BASE_WALK_SPEED = 0.5;

    // sliders & spins xoffset
    this.RNG_SEED = 1337;
    var rng = new LegacyRandom(this.RNG_SEED);

    let lastPosition = null;
    let lastStartTime = 0;

    for (var i = 0; i < this.HitObjects.length; i++) {
        let hitObject = this.HitObjects[i];
        // console.log(hitObject.nested)
        if (hitObject instanceof Fruit) {
            if (mods.HR) {
                let offsetPosition = hitObject.position.x;
                let startTime = hitObject.time;
                if (lastPosition == null) {
                    lastPosition = offsetPosition;
                    lastStartTime = startTime;
                    continue;
                }
                let positionDiff = offsetPosition - lastPosition;
                // Todo: BUG!! Stable calculated time deltas as ints, which affects randomisation. This should be changed to a double.
                let timeDiff = parseInt(startTime - lastStartTime);
                if (timeDiff > 1000) {
                    lastPosition = offsetPosition;
                    lastStartTime = startTime;
                    continue;
                }
                if (positionDiff == 0) {
                    let right = rng.NextBool();
                    let rand = Math.min(20, rng.Next(0, Math.max(0, timeDiff / 4)));
                    if (right) {
                        // Clamp to the right bound
                        if (offsetPosition + rand <= Beatmap.MAX_X) offsetPosition += rand;
                        else offsetPosition -= rand;
                    }
                    else {
                        // Clamp to the left bound
                        if (offsetPosition - rand >= 0) offsetPosition -= rand;
                        else offsetPosition += rand;
                    }
                    hitObject.position.x = offsetPosition;
                    continue;
                }
                // ReSharper disable once PossibleLossOfFraction
                if (Math.abs(positionDiff) < timeDiff / 3)
                    if (positionDiff > 0) {
                        // Clamp to the right bound
                        if (offsetPosition + positionDiff < Beatmap.MAX_X) offsetPosition += positionDiff;
                    }
                    else {
                        // Clamp to the left bound
                        if (offsetPosition + positionDiff > 0) offsetPosition += positionDiff;
                    }

                hitObject.position.x = offsetPosition;

                lastPosition = offsetPosition;
                lastStartTime = startTime;
            }
        }

        else if (hitObject instanceof BananaShower) {
            hitObject.nested.forEach(banana => {
                banana.x += (rng.NextDouble() * Beatmap.MAX_X);
                rng.Next(); // osu!stable retrieved a random banana type
                rng.Next(); // osu!stable retrieved a random banana rotation
                rng.Next(); // osu!stable retrieved a random banana colour
            });
        }
        else if (hitObject instanceof JuiceStream) {
            // Todo: BUG!! Stable used the last control point as the final position of the path, but it should use the computed path instead.
            lastPosition = hitObject.points[hitObject.points.length - 1].x;
            // Todo: BUG!! Stable attempted to use the end time of the stream, but referenced it too early in execution and used the start time instead.
            lastStartTime = hitObject.time;
            hitObject.nested.forEach(item => {
                if (item.type === "TinyDroplet") item.x += Math.clamp(rng.Next(-20, 20), -item.x, Beatmap.MAX_X - item.x);
                else if (item.type === "Droplet") rng.Next(); // osu!stable retrieved a random droplet rotation
            });
        }
    }

    // catch objects
    this.palpableObjects = [];
    this.fullCatchObjects = [];

    this.accObjectCount = 0;
    this.bananaCount = 0;

    for (var i = 0; i < this.HitObjects.length; i++) {
        let hitObject = this.HitObjects[i];
        if (hitObject instanceof Fruit) {
            let pch = new PalpableCatchHitObject({
                type: "Fruit",
                time: hitObject.time,
                x: hitObject.position.x,
                color: hitObject.color,
                radius: this.circleRadius,
                hitSound: hitObject.hitSound,
            }, this);

            this.palpableObjects.push(pch);
            this.fullCatchObjects.push(pch);
            this.accObjectCount++;
        }
        else if (hitObject instanceof BananaShower) {
            hitObject.nested.forEach(banana => {
                this.fullCatchObjects.push(banana);
                this.bananaCount += 1;
            });
        }
        else if (hitObject instanceof JuiceStream) {
            hitObject.nested.forEach(item => {
                this.fullCatchObjects.push(item);
                this.accObjectCount++;
                if (item.type != "TinyDroplet") this.palpableObjects.push(item);
            });
        }
    }
    this.palpableObjects.sort((a, b) => a.time - b.time);
    this.fullCatchObjects.sort((a, b) => a.time - b.time);

    // scoring
    let playableLength = this.fullCatchObjects[this.fullCatchObjects.length - 1].time - this.fullCatchObjects[0].time;
    let totalBreakTime = 0
    for (let i = 0; i < this.Breaks.length; i++) {
        totalBreakTime += this.Breaks[i].end - this.Breaks[i].start;
    }
    // drainLength is int (var type is int in C#)
    let drainLength = Csharp_Round(Math.max(playableLength - totalBreakTime, 0) / 1000);

    // objectToDrainRatio is float
    let objectToDrainRatio = Number2Float(Math.max(0, Math.min((this.HitObjects.length / drainLength * 8), 16)));

    // difficultyMultiplier is int (used math.round and (int) in C#)
    let difficultyMultiplier = Csharp_Round((this.OriginHPDrainRate + this.OriginCircleSize + this.OriginOverallDifficulty + objectToDrainRatio) / 38 * 5);

    // modMultiplier is double
    let modMultiplier = 1;

    if (mods.EZ) modMultiplier *= 0.5;
    else if (mods.HR) modMultiplier *= 1.12;
    if (mods.DT) modMultiplier *= 1.06;
    else if (mods.HT) modMultiplier *= 0.3;
    if (mods.NF) modMultiplier *= 0.5;
    if (mods.HD) modMultiplier *= 1.06;
    if (mods.FL) modMultiplier *= 1.12;

    // decimal fix
    modMultiplier = parseFloat(modMultiplier.toFixed(8));

    // ScoreMultiplier is double
    let ScoreMultiplier = difficultyMultiplier * modMultiplier;

    this.baseScoreSS = 0; // no banana, full tinyDroplets
    let previousCombo = 0;

    for (let i = 0; i < this.fullCatchObjects.length; i++) {
        let currentObject = this.fullCatchObjects[i];
        let comboMultiplier = Math.max(previousCombo - 1, 0);
        if (currentObject.type == "Fruit") {
            // 300 / 25 = 12
            let scoreIncrease = 12 * comboMultiplier * ScoreMultiplier;
            // scoreIncrease is int (used (int) in c#)
            let scoreIncreaseInt = Csharp_Number2Int(scoreIncrease);
            // fruit score = 300 + scoreIncrease
            let scoreInt = 300 + scoreIncreaseInt;
            this.baseScoreSS += scoreInt;
            previousCombo += 1;

            // console.log(this.baseScoreSS + "(+" + scoreInt + ")");
        }
        else if (currentObject.type == "Droplet") {
            this.baseScoreSS += 100;
            previousCombo += 1;
        }
        else if (currentObject.type == "TinyDroplet") {
            this.baseScoreSS += 10;
        }
    }
    this.baseScoreSS = Math.round(this.baseScoreSS);
}
Catch.prototype = Object.create(Beatmap.prototype, {
    approachTime: { // droptime
        get: function () {
            return this.ApproachRate < 5
                ? 1800 - this.ApproachRate * 120
                : 1200 - (this.ApproachRate - 5) * 150;
        }
    },
    // https://github.com/itdelatrisu/opsu/commit/8892973d98e04ebaa6656fe2a23749e61a122705
    circleDiameter: {
        get: function () {
            return 108.848 - this.CircleSize * 8.9646;
        }
    }
});
Catch.prototype.constructor = Catch;
Catch.prototype.hitObjectTypes = {};
