function Slider(data, beatmap)
{
    HitCircle.call(this, data, beatmap);

    var points = data[5].split('|');
    var sliderType = points[0];
    points[0] = this.position;
    for (var i = 1; i < points.length; i++)
    {
        points[i] = new Point(points[i].split(':'));
    }
    this.repeat = data[6] | 0;
    this.pixelLength = +data[7];

    this.hitSoundString = data[8] || "";

    var sliderTime = this.beatmap.timingPointAt(this.time).beatLength * (
            this.pixelLength / this.beatmap.SliderMultiplier
        ) / 100;
    this.endTime += sliderTime * this.repeat;
    this.duration = this.endTime - this.time;

    this.curve = Curve.parse(sliderType, points, this.pixelLength);

    this.endPosition = this.curve.pointAt(1);
}
Slider.prototype = Object.create(HitCircle.prototype);
Slider.prototype.constructor = Slider;
Slider.ID = 2;
