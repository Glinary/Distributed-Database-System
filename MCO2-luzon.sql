-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema stadvdbmco2luzon
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `stadvdbmco2luzon` ;

-- -----------------------------------------------------
-- Schema stadvdbmco2luzon
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `stadvdbmco2luzon` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `stadvdbmco2luzon` ;

-- -----------------------------------------------------
-- Table `stadvdbmco2luzon`.`doctors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2luzon`.`doctors` (
  `doctorid` VARCHAR(45) NOT NULL,
  `mainspecialty` TEXT NULL,
  `age` INT NULL,
  PRIMARY KEY (`doctorid`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `stadvdbmco2luzon`.`px`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2luzon`.`px` (
  `pxid` VARCHAR(45) NOT NULL,
  `age` INT NULL,
  `gender` ENUM('MALE', 'FEMALE') NULL,
  PRIMARY KEY (`pxid`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `stadvdbmco2luzon`.`clinics`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2luzon`.`clinics` (
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
-- Table `stadvdbmco2luzon`.`appt_main`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stadvdbmco2luzon`.`appt_main` (
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
    REFERENCES `stadvdbmco2luzon`.`doctors` (`doctorid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `px`
    FOREIGN KEY (`pxid`)
    REFERENCES `stadvdbmco2luzon`.`px` (`pxid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `clinics`
    FOREIGN KEY (`clinicid`)
    REFERENCES `stadvdbmco2luzon`.`clinics` (`clinicid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
