-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema stadvdbmco2vismin
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `stadvdbmco2vismin` ;

-- -----------------------------------------------------
-- Schema stadvdbmco2vismin
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `stadvdbmco2vismin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `stadvdbmco2vismin` ;

-- -----------------------------------------------------
-- Table `stadvdbmco2vismin`.`doctors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2vismin`.`doctors` (
  `doctorid` VARCHAR(45) NOT NULL,
  `mainspecialty` TEXT NULL,
  `age` INT NULL,
  PRIMARY KEY (`doctorid`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `stadvdbmco2vismin`.`px`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2vismin`.`px` (
  `pxid` VARCHAR(45) NOT NULL,
  `age` INT NULL,
  `gender` ENUM('MALE', 'FEMALE') NULL,
  PRIMARY KEY (`pxid`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `stadvdbmco2vismin`.`clinics`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2vismin`.`clinics` (
  `clinicid` VARCHAR(45) NOT NULL,
  `hospitalname` VARCHAR(45) NULL DEFAULT NULL,
  `IsHospital` BOOLEAN NULL DEFAULT NULL,
  `City` TEXT NULL DEFAULT NULL,
  `Province` TEXT NULL DEFAULT NULL,
  `RegionName` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`clinicid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `stadvdbmco2vismin`.`appt_main`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2vismin`.`appt_main` (
  `pxid` VARCHAR(45) NOT NULL,
  `clinicid` VARCHAR(45) NOT NULL,
  `doctorid` VARCHAR(45) NOT NULL,
  `apptid` VARCHAR(45) NOT NULL,
  `status` ENUM('Complete', 'Queued', 'NoShow', 'Serving', 'Cancel', 'Skip', 'Admitted') NOT NULL,
  `TimeQueued` DATETIME NULL DEFAULT NULL,
  `QueueDate` DATETIME NULL DEFAULT NULL,
  `StartTime` DATETIME NULL DEFAULT NULL,
  `EndTime` DATETIME NULL DEFAULT NULL,
  `type` ENUM('Consultation', 'Inpatient') NOT NULL,
  `Virtual` BOOLEAN NULL,
  PRIMARY KEY (`apptid`),
  INDEX `doctors_idx` (`doctorid` ASC) VISIBLE,
  INDEX `px_idx` (`pxid` ASC) VISIBLE,
  INDEX `clinics_idx` (`clinicid` ASC) VISIBLE,
  CONSTRAINT `doctors`
    FOREIGN KEY (`doctorid`)
    REFERENCES `stadvdbmco1`.`doctors` (`doctorid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `px`
    FOREIGN KEY (`pxid`)
    REFERENCES `stadvdbmco1`.`px` (`pxid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `clinics`
    FOREIGN KEY (`clinicid`)
    REFERENCES `stadvdbmco1`.`clinics` (`clinicid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
