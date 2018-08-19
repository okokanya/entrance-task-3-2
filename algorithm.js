function saveMoney(input) {
  consumedEnergy = {
    value: 0,
    devices: {}
  }

  let schedule = {};
  for (let i = 0; i < 24; i++) {
    schedule[i] = [];
  }

  const devicesObject = {};
  input.devices.forEach(device => (devicesObject[device.id] = device));

  const devicesInSchedule = [];

  input.rates.sort(compareValue);
  function compareValue(rateA, rateB) {
    return rateA.value - rateB.value;
  }

  const devicesWithIndex = input.devices.map(device => {
    device.index = device.power * device.duration;
    return device;
  });

  function compareIndex(deviceA, deviceB) {
    return deviceB.index - deviceA.index;
  }

  function getHourValue(hour) {
    return input.rates.reduce((acc, rate) => rate.from <= hour && rate.to > hour ? rate.value : acc);
  }

  devicesWithIndex.sort(compareIndex);

  function canTurnOnDevice(hour, id) {
    if (devicesInSchedule.includes(id)) return false;
    const mode = hour > 7 && hour < 23 ? "day" : "night";
    const deviceMode = devicesObject[id].mode;
    if (deviceMode && deviceMode !== mode) return false;
    const usedPower = schedule[hour].reduce(
      (acc, deviceId) => acc + devicesObject[deviceId].power, 0);
    const remainingPower = 2100 - usedPower;
    if (remainingPower < devicesObject[id].power) return false;
    return true;
  }

  function getHourValue(hour) {
    return input.rates.reduce((acc, rate) => {
      if (rate.from > rate.to) {
        return (rate.from <= hour && hour < 24) || (hour >= 0 && hour < rate.to) ? rate.value : acc;
      } else {
        return rate.from <= hour && rate.to > hour ? rate.value : acc
      }
    }, 0)
  }

  function turnOnDevice(hour, id) {
    const duration = devicesObject[id].duration;
    for (let i = hour; i < hour + duration; i++) {
      const pushToHour = i > 23 ? i % 24 : i;
      schedule[pushToHour].push(id);

      const value = getHourValue(pushToHour) * devicesObject[id].power / 1000;
      consumedEnergy.value = consumedEnergy.value + value;
      if (consumedEnergy.devices[id]) {
        consumedEnergy.devices[id] = consumedEnergy.devices[id] + value;
      } else {
        consumedEnergy.devices[id] = value;
      }
    }
    devicesInSchedule.push(id);

  }

  input.rates.forEach(rate => {
    const time =
      rate.from < rate.to ? rate.to - rate.from : 24 - rate.from + rate.to;

    for (let i = rate.from; i < rate.from + time; i++) {
      devicesWithIndex.forEach(device => {
        const hour = i % 24;
        if (canTurnOnDevice(hour, device.id)) turnOnDevice(hour, device.id);
      })
    }
  });
  return { schedule, consumedEnergy };
}