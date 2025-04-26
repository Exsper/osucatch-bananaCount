function HitCircle(data, beatmap)
{
    HitObject.call(this, data, beatmap);

    this.stack = 0;
}
HitCircle.prototype = Object.create(HitObject.prototype, {
    newCombo: {
        get: function()
        {
            return this.flag & 4;
        }
    },
    comboSkip: {
        get: function()
        {
            return this.flag >> 4;
        }
    }
});
HitCircle.prototype.constructor = HitCircle;
HitCircle.ID = 1;
