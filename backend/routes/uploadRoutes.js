import express from "express";
import multer from "multer";
import path from "path";


const router = express.Router();


const storage = multer.diskStorage({

destination:(req,file,cb)=>{

cb(null,"uploads");

},


filename:(req,file,cb)=>{

cb(
null,
Date.now()+path.extname(file.originalname)
);

}

});


const upload = multer({
storage
});



router.post(
"/logo",
upload.single("logo"),
(req,res)=>{


if(!req.file){

return res.status(400).json({

success:false,
message:"No logo uploaded"

});

}


res.json({

success:true,

logo:`/uploads/${req.file.filename}`

});


});

router.post(
  "/certificate",
  upload.single("certificate"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No certificate uploaded"
      });
    }

    res.json({
      success: true,
      fileUrl: `/uploads/${req.file.filename}`
    });
  }
);


export default router;