export function getTimeInfo() {
    const time = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
    let hour = time.getHours() % 12 || 12;
    const amPm = time.getHours() >= 12 ? 'PM' : 'AM';
    const timezoneOffsetString = `+${Math.abs(time.getTimezoneOffset() / 60)}`;

    return { hour, amPm, timezoneOffsetString };
}
