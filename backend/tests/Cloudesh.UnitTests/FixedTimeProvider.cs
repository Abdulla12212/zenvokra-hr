namespace Cloudesh.UnitTests;

/// <summary>
/// A <see cref="TimeProvider"/> that returns whatever time the test says it is.
/// </summary>
internal sealed class FixedTimeProvider : TimeProvider
{
    public FixedTimeProvider(DateTimeOffset now) => Now = now;

    public DateTimeOffset Now { get; set; }

    public override DateTimeOffset GetUtcNow() => Now;

    public void Advance(TimeSpan delta) => Now = Now.Add(delta);
}
