function Spinner(data, beatmap)
{
    HitCircle.call(this, data, beatmap);

    this.endTime = data[5] | 0;
    this.duration = this.endTime - this.time;
}
Spinner.prototype = Object.create(HitCircle.prototype);
Spinner.prototype.constructor = Spinner;
Spinner.ID = 8;
